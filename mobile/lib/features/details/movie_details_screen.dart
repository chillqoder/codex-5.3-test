import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../state/providers.dart';
import '../../widgets/movie_image.dart';

class MovieDetailsScreen extends ConsumerWidget {
  const MovieDetailsScreen({super.key, required this.movieId});

  final String movieId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movieAsync = ref.watch(movieByIdProvider(movieId));

    return Scaffold(
      appBar: AppBar(title: const Text('О фильме')),
      body: movieAsync.when(
        data: (movie) {
          if (movie == null) {
            return const Center(child: Text('Фильм не найден'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MovieImage(
                  path: movie.backdrop,
                  height: 220,
                  fit: BoxFit.cover,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              movie.title,
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                          ),
                          IconButton.filledTonal(
                            onPressed: () async {
                              await ref
                                  .read(movieRepositoryProvider)
                                  .toggleFavorite(movie.id);
                              ref
                                  .read(movieRefreshTriggerProvider.notifier)
                                  .state++;
                            },
                            icon: Icon(
                              movie.isFavorite
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                              color: movie.isFavorite
                                  ? AppTheme.accent
                                  : AppTheme.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${movie.year} • ${movie.duration} мин • ${movie.rating.toStringAsFixed(1)}',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: movie.genres
                            .map((genre) => Chip(label: Text(_genreRu(genre))))
                            .toList(growable: false),
                      ),
                      const SizedBox(height: 14),
                      Text(movie.description),
                      const SizedBox(height: 18),
                      Text(
                        'Режиссер',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 6),
                      Text(movie.director),
                      const SizedBox(height: 16),
                      Text(
                        'Актеры',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 6),
                      Text(movie.cast.join(', ')),
                      const SizedBox(height: 16),
                      Text(
                        'Теги',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: movie.tags
                            .map((tag) => Chip(label: Text(tag)))
                            .toList(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text('Ошибка загрузки: $error'),
            ),
          );
        },
      ),
    );
  }

  String _genreRu(String genre) {
    const mapping = {
      'action': 'Боевик',
      'adventure': 'Приключения',
      'drama': 'Драма',
      'comedy': 'Комедия',
      'thriller': 'Триллер',
      'sci-fi': 'Фантастика',
      'horror': 'Ужасы',
      'romance': 'Романтика',
      'history': 'История',
      'biography': 'Биография',
      'fantasy': 'Фэнтези',
      'animation': 'Анимация',
      'mystery': 'Мистика',
      'crime': 'Криминал',
      'family': 'Семейный',
    };
    return mapping[genre.toLowerCase()] ?? genre;
  }
}
