import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../domain/movie.dart';
import '../../state/providers.dart';
import '../../widgets/movie_card.dart';
import '../details/movie_details_screen.dart';

enum FavoriteSort { title, rating, year, duration }

class FavoritesTab extends ConsumerStatefulWidget {
  const FavoritesTab({super.key});

  @override
  ConsumerState<FavoritesTab> createState() => _FavoritesTabState();
}

class _FavoritesTabState extends ConsumerState<FavoritesTab> {
  FavoriteSort _sort = FavoriteSort.rating;

  @override
  Widget build(BuildContext context) {
    final favoritesAsync = ref.watch(favoritesProvider);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
          child: Row(
            children: [
              const Text('Сортировка:'),
              const SizedBox(width: 10),
              Expanded(
                child: SegmentedButton<FavoriteSort>(
                  segments: const [
                    ButtonSegment(
                      value: FavoriteSort.rating,
                      label: Text('Рейтинг'),
                    ),
                    ButtonSegment(value: FavoriteSort.year, label: Text('Год')),
                    ButtonSegment(
                      value: FavoriteSort.title,
                      label: Text('Название'),
                    ),
                    ButtonSegment(
                      value: FavoriteSort.duration,
                      label: Text('Длина'),
                    ),
                  ],
                  selected: {_sort},
                  onSelectionChanged: (selection) {
                    final value = selection.firstOrNull;
                    if (value == null) {
                      return;
                    }
                    setState(() => _sort = value);
                  },
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: favoritesAsync.when(
            data: (favorites) {
              if (favorites.isEmpty) {
                return const Center(child: Text('В избранном пока пусто'));
              }

              final sorted = _sortItems(favorites);

              return ListView.builder(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 18),
                itemCount: sorted.length,
                itemBuilder: (context, index) {
                  final movie = sorted[index];
                  return Stack(
                    children: [
                      MovieCard(
                        movie: movie,
                        compact: true,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) =>
                                  MovieDetailsScreen(movieId: movie.id),
                            ),
                          );
                        },
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: IconButton.filledTonal(
                          onPressed: () async {
                            await ref
                                .read(movieRepositoryProvider)
                                .setFavorite(movie.id, false);
                            ref
                                .read(movieRefreshTriggerProvider.notifier)
                                .state++;
                          },
                          icon: const Icon(
                            Icons.delete_outline,
                            color: AppTheme.error,
                          ),
                        ),
                      ),
                    ],
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text('Ошибка загрузки: $error'),
              ),
            ),
          ),
        ),
      ],
    );
  }

  List<Movie> _sortItems(List<Movie> movies) {
    final sorted = List<Movie>.from(movies);

    switch (_sort) {
      case FavoriteSort.title:
        sorted.sort((a, b) => a.title.compareTo(b.title));
      case FavoriteSort.rating:
        sorted.sort((a, b) => b.rating.compareTo(a.rating));
      case FavoriteSort.year:
        sorted.sort((a, b) => b.year.compareTo(a.year));
      case FavoriteSort.duration:
        sorted.sort((a, b) => a.duration.compareTo(b.duration));
    }

    return sorted;
  }
}
