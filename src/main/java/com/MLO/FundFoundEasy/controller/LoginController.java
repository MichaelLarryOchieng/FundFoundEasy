package com.MLO.FundFoundEasy.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoginController {

    @RequestMapping("/Login")
    public String login(){
        return "Login Page..";
    }
}
