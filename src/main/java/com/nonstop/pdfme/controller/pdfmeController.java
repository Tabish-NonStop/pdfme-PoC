package com.nonstop.pdfme.controller;

import com.nonstop.pdfme.service.pdfmeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;

@RestController
@RequestMapping("/api")
public class pdfmeController {
    public static pdfmeService pdfmeService;

    public pdfmeController(pdfmeService pdfmeService) {
        pdfmeController.pdfmeService = pdfmeService;
    }

    @GetMapping("/status")
    public String status() {
        return pdfmeService.status();
    }

    @PostMapping(value = "/pdf-template", produces = "application/pdf")
    public ResponseEntity<StreamingResponseBody> generatePdfFromTemplate(@RequestBody String templateJson)
            throws IOException {
        return pdfmeService.generatePdfFromTemplate(templateJson);
    }
}
