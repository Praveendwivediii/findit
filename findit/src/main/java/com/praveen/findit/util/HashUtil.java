package com.praveen.findit.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public final class HashUtil {

    private HashUtil() {
        // object banane ki zarurat nahi, sirf static methods hain
    }

    // "  Black  " , "BLACK", "black" -> teeno "black" ban jayenge
    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        return text.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    // Text ko SHA-256 hash (64 character ki string) mein badalta hai
    public static String hash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(normalize(text).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    // User ka diya answer saved hash se match karta hai
    public static boolean matches(String rawAnswer, String storedHash) {
        if (storedHash == null) {
            return false;
        }
        byte[] a = hash(rawAnswer).getBytes(StandardCharsets.UTF_8);
        byte[] b = storedHash.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(a, b);
    }
}