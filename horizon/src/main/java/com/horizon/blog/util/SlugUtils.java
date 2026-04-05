package com.horizon.blog.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugUtils {

    private SlugUtils() {
    }

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "post";
        }

        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");

        return normalized.isBlank() ? "post" : normalized;
    }
}
