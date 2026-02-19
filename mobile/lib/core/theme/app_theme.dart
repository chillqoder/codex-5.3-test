import 'package:flutter/material.dart';

class AppTheme {
  static const Color background = Color(0xFF111219);
  static const Color surface = Color(0xFF15171A);
  static const Color textPrimary = Color(0xFFE6E7EB);
  static const Color textSecondary = Color(0xFFA6A8AD);
  static const Color accent = Color(0xFF2ECC71);
  static const Color error = Color(0xFFFF6B6B);

  static ThemeData dark() {
    const scheme = ColorScheme.dark(
      primary: accent,
      secondary: accent,
      error: error,
      surface: surface,
      onPrimary: background,
      onSecondary: background,
      onSurface: textPrimary,
      onError: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      cardColor: surface,
      dividerColor: textSecondary.withValues(alpha: 0.2),
      textTheme: const TextTheme(
        titleLarge: TextStyle(fontWeight: FontWeight.w600),
        titleMedium: TextStyle(fontWeight: FontWeight.w600),
      ).apply(bodyColor: textPrimary, displayColor: textPrimary),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        foregroundColor: textPrimary,
        centerTitle: false,
      ),
      chipTheme: ChipThemeData(
        selectedColor: accent,
        checkmarkColor: background,
        backgroundColor: surface,
        side: BorderSide(color: textSecondary.withValues(alpha: 0.3)),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      colorSchemeSeed: accent,
      brightness: Brightness.light,
    );

    return base.copyWith(
      textTheme: base.textTheme.copyWith(
        titleLarge: const TextStyle(fontWeight: FontWeight.w600),
        titleMedium: const TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }
}
