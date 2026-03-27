package com.aqicalculator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class AqiCalculatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(AqiCalculatorApplication.class, args);
    }
}
