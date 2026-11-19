package com.digitallegacy.controller;

import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.AssetCategoryDto;
import com.digitallegacy.service.AssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Asset Categories", description = "Endpoints for retrieving supported digital asset categories")
public class CategoryController {

    private final AssetService assetService;

    @GetMapping
    @Operation(summary = "List all active supported digital asset categories")
    public ResponseEntity<ApiResponse<List<AssetCategoryDto>>> getCategories() {
        List<AssetCategoryDto> categories = assetService.getAllActiveCategories();
        return ResponseEntity.ok(ApiResponse.success("Categories loaded successfully", categories));
    }
}
