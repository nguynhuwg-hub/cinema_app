package com.example.demo.module.booking.service;

import com.example.demo.module.booking.entity.Payment;
import com.example.demo.module.booking.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VnpayQueryService {

    private final PaymentRepository payments;
    private final BookingService bookings;

    private static final Logger log = LoggerFactory.getLogger(VnpayQueryService.class);
    private final RestClient restClient = createRestClient();

    private static RestClient createRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        return RestClient.builder().requestFactory(factory).build();
    }

    private static String diagnosticCode(Object value) {
        String text = Objects.toString(value, "");
        return text.matches("[a-zA-Z0-9_-]{1,32}") ? text : "UNKNOWN";
    }

    @Value("${app.vnpay.tmn-code:}")
    private String tmnCode;

    @Value("${app.vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${app.vnpay.query-url:https://sandbox.vnpayment.vn/merchant_webapi/api/transaction}")
    private String queryUrl;

    private static final DateTimeFormatter FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private static final ZoneId VNPAY_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    public Map<String, String> queryPayment(
            Long bookingId,
            String serverIp
    ) {
        if (tmnCode == null || tmnCode.isBlank() || hashSecret == null || hashSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình mã merchant hoặc khóa VNPay trên backend.");
        }

        Payment payment = payments.findByBookingId(bookingId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Không tìm thấy giao dịch thanh toán. Hãy mở thanh toán từ đơn trước.")
                );

        if (payment.getVnpTxnRef() == null
                || payment.getVnpCreateDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn chưa có mã giao dịch VNPay. Hãy mở thanh toán từ đơn trước.");
        }

        String requestId =
                UUID.randomUUID().toString().replace("-", "");

        String createDate = LocalDateTime.now(VNPAY_ZONE)
                .format(FORMAT);

        Map<String, String> request = new LinkedHashMap<>();

        request.put("vnp_RequestId", requestId);
        request.put("vnp_Version", "2.1.0");
        request.put("vnp_Command", "querydr");
        request.put("vnp_TmnCode", tmnCode);
        request.put("vnp_TxnRef", payment.getVnpTxnRef());
        request.put(
                "vnp_OrderInfo",
                "Truy van giao dich " + payment.getVnpTxnRef()
        );
        request.put(
                "vnp_TransactionDate",
                payment.getVnpCreateDate()
        );
        request.put("vnp_CreateDate", createDate);
        request.put("vnp_IpAddr", serverIp);

        String requestData = String.join("|",
                request.get("vnp_RequestId"),
                request.get("vnp_Version"),
                request.get("vnp_Command"),
                request.get("vnp_TmnCode"),
                request.get("vnp_TxnRef"),
                request.get("vnp_TransactionDate"),
                request.get("vnp_CreateDate"),
                request.get("vnp_IpAddr"),
                request.get("vnp_OrderInfo")
        );

        request.put("vnp_SecureHash", hmac(requestData));

        // Metadata only: never log request bodies, HMACs or merchant secrets.
        log.info(
                "VNPay QueryDr request: bookingId={}, txnRef={}, transactionDate={}, createDate={}, ip={}",
                bookingId,
                diagnosticCode(payment.getVnpTxnRef()),
                diagnosticCode(payment.getVnpCreateDate()),
                createDate,
                serverIp != null && serverIp.matches("[0-9a-fA-F:.]{1,64}")
                        ? serverIp : "INVALID_IP"
        );

        Map<String, Object> response;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restClient.post()
                    .uri(queryUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);
            response = body;
        } catch (RestClientResponseException ex) {
            log.warn("VNPay QueryDr HTTP failure: bookingId={}, httpStatus={}",
                    bookingId, ex.getStatusCode().value());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "VNPay từ chối truy vấn (HTTP " + ex.getStatusCode().value() + "). Chưa thể xác nhận giao dịch.");
        } catch (ResourceAccessException ex) {
            log.warn("VNPay QueryDr connection failure: bookingId={}, exception={}",
                    bookingId, ex.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT,
                    "Không kết nối được VNPay hoặc truy vấn quá thời gian chờ. Vui lòng kiểm tra lại sau.");
        } catch (RestClientException ex) {
            log.warn("VNPay QueryDr invalid response: bookingId={}, exception={}",
                    bookingId, ex.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Phản hồi truy vấn VNPay không đúng định dạng. Chưa thể xác nhận giao dịch.");
        }

        if (response == null || response.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "VNPay không trả dữ liệu truy vấn. Vui lòng kiểm tra lại sau.");
        }

        // These values are untrusted diagnostics until signature verification succeeds.
        // Do not log full responses, request payloads, hashes or merchant secrets.
        String diagnosticResponseCode = diagnosticCode(response.get("vnp_ResponseCode"));
        String receivedHash = Objects.toString(response.get("vnp_SecureHash"), "");
        if (!receivedHash.matches("[a-fA-F0-9]{128}")) {
            String gatewayMessage = Objects.toString(
                    response.get("vnp_Message"),
                    "Không có thông báo"
            ).replaceAll("[\\r\\n\\t]", " ");

            if (gatewayMessage.length() > 200) {
                gatewayMessage = gatewayMessage.substring(0, 200);
            }

            log.warn(
                    "VNPay QueryDr diagnostic: bookingId={}, unverifiedCode={}, message={}",
                    bookingId,
                    diagnosticResponseCode,
                    gatewayMessage
            );

            log.warn("VNPay QueryDr unsigned/invalid-hash response: bookingId={}, unverifiedCode={}, hashLength={}",
                    bookingId, diagnosticResponseCode, receivedHash.length());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "VNPay trả phản hồi thiếu chữ ký hoặc sai định dạng chữ ký (mã phản hồi chưa xác thực: "
                            + diagnosticResponseCode + "). Chưa thể xác nhận thanh toán.");
        }

        String[] signatureFields = {
                "vnp_ResponseId",
                "vnp_Command",
                "vnp_ResponseCode",
                "vnp_Message",
                "vnp_TmnCode",
                "vnp_TxnRef",
                "vnp_Amount",
                "vnp_BankCode",
                "vnp_PayDate",
                "vnp_TransactionNo",
                "vnp_TransactionType",
                "vnp_TransactionStatus",
                "vnp_OrderInfo",
                "vnp_PromotionCode",
                "vnp_PromotionAmount"
        };

        List<String> values = new ArrayList<>();

        for (String field : signatureFields) {
            Object value = response.get(field);
            values.add(value == null ? "" : value.toString());
        }

        String expectedHash = hmac(String.join("|", values));

        if (!MessageDigest.isEqual(
                expectedHash.getBytes(StandardCharsets.US_ASCII),
                receivedHash.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII))) {
            log.warn("VNPay QueryDr signature mismatch: bookingId={}, unverifiedCode={}, hashLength={}",
                    bookingId, diagnosticResponseCode, receivedHash.length());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Chữ ký phản hồi QueryDr không khớp (mã phản hồi chưa xác thực: "
                            + diagnosticResponseCode + "). Cần kiểm tra khóa sandbox và định dạng dữ liệu ký; đơn chưa được xác nhận.");
        }

        if (!tmnCode.equals(response.get("vnp_TmnCode"))
                || !payment.getVnpTxnRef().equals(
                        response.get("vnp_TxnRef")
                )
                || !"querydr".equals(response.get("vnp_Command"))) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Thông tin phản hồi VNPay không khớp merchant hoặc đơn đặt vé.");
        }

        String responseCode = Objects.toString(
                response.get("vnp_ResponseCode"), ""
        );

        String transactionStatus = Objects.toString(
                response.get("vnp_TransactionStatus"), ""
        );

        if (!"00".equals(responseCode)) {
            log.warn("VNPay QueryDr rejected: bookingId={}, verifiedCode={}",
                    bookingId, diagnosticCode(responseCode));
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "VNPay không thực hiện được truy vấn (mã " + diagnosticCode(responseCode)
                            + "). Chưa thể xác nhận thanh toán.");
        }

        if (!"00".equals(transactionStatus)) {
            return Map.of(
                    "status", "NOT_PAID",
                    "transactionStatus", transactionStatus
            );
        }

        String amount = Objects.toString(
                response.get("vnp_Amount"), ""
        );

        String transactionNo = Objects.toString(
                response.get("vnp_TransactionNo"), ""
        );

        if (!amount.matches("[0-9]{1,18}")
                || !transactionNo.matches("[0-9]{1,15}")
                || transactionNo.matches("0+")) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Số tiền hoặc mã giao dịch VNPay không hợp lệ.");
        }

        String result = bookings.applyVnpayPayment(
                bookingId,
                new java.math.BigDecimal(amount).movePointLeft(2),
                transactionNo,
                responseCode,
                true
        );

        return Map.of(
                "status", "VERIFIED",
                "bookingResult", result
        );
    }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");

            mac.init(new SecretKeySpec(
                    hashSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            ));

            return HexFormat.of().formatHex(
                    mac.doFinal(data.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Không thể tạo chữ ký QueryDr.",
                    ex
            );
        }
    }
}
