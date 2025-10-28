package com.nonstop.pdfme.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.*;
import java.nio.charset.StandardCharsets;

@Service
public class pdfmeService {

    /**
     *
     * @return "Ok" if the application is up and running
     */
    public String status() {
        return "Ok";
    }



    public ResponseEntity<StreamingResponseBody> generatePdfFromTemplate(String templateJson) throws IOException {
        // 1. Start the Node.js process

        ProcessBuilder pb = new ProcessBuilder("node", "scripts/index.js");
        pb.redirectError(ProcessBuilder.Redirect.PIPE);
        Process process = pb.start();

        // 2. Send the JSON input to Node’s stdin
        try (OutputStream pIn = process.getOutputStream()) {
            pIn.write(templateJson.getBytes(StandardCharsets.UTF_8));
            pIn.flush();
        }

        // 3. Capture stderr asynchronously
        ByteArrayOutputStream errBuffer = new ByteArrayOutputStream();
        Thread errThread = new Thread(() -> {
            try (InputStream err = process.getErrorStream()) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = err.read(buffer)) != -1) {
                    errBuffer.write(buffer, 0, bytesRead);
                }
            } catch (IOException ignored) {}
        });
        errThread.start();

        // 4. Stream the PDF output back as a response body
        StreamingResponseBody stream = outputStream -> {
            try (InputStream procOut = process.getInputStream()) {
                byte[] buffer = new byte[8192];
                int len;
                while ((len = procOut.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, len);
                }
                outputStream.flush();

                process.waitFor();
                errThread.join();

                if (process.exitValue() != 0) {
                    String errMsg = errBuffer.toString(StandardCharsets.UTF_8);
                    throw new RuntimeException("Node process failed: " + errMsg);
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException(e);
            }
        };

        // 5. Set PDF response headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename("generated-template.pdf").build());

        return new ResponseEntity<>(stream, headers, HttpStatus.OK);
    }
}