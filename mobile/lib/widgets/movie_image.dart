import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

class MovieImage extends StatelessWidget {
  const MovieImage({
    super.key,
    required this.path,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  final String path;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final isNetwork = path.startsWith('http://') || path.startsWith('https://');

    final image = isNetwork
        ? Image.network(
            path,
            height: height,
            fit: fit,
            errorBuilder: (context, error, stackTrace) => _fallback(),
            loadingBuilder: (context, child, progress) {
              if (progress == null) {
                return child;
              }
              return SizedBox(
                height: height,
                child: const Center(child: CircularProgressIndicator()),
              );
            },
          )
        : Image.asset(
            path,
            height: height,
            fit: fit,
            errorBuilder: (context, error, stackTrace) => _fallback(),
          );

    if (borderRadius == null) {
      return image;
    }

    return ClipRRect(borderRadius: borderRadius!, child: image);
  }

  Widget _fallback() {
    return Container(
      height: height,
      color: AppTheme.surface,
      alignment: Alignment.center,
      child: const Icon(
        Icons.movie_creation_outlined,
        size: 40,
        color: AppTheme.textSecondary,
      ),
    );
  }
}
