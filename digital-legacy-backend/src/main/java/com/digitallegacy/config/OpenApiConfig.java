package com.digitallegacy.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI digitalLegacyOpenAPI() {
        final String securitySchemeName = "BearerAuthentication";

        return new OpenAPI()
                .info(new Info()
                        .title("Digital Legacy Manager API")
                        .description("REST API documentation for Digital Legacy Manager - Secure Digital Estate Management & Beneficiary Transfer")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Digital Legacy Engineering Team")
                                .email("support@digitallegacy.com"))
                        .license(new License()
                                .name("Enterprise Proprietary License")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT token obtained from /api/auth/login or /api/auth/admin-login")));
    }
}
