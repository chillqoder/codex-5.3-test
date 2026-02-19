import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../domain/movie.dart';
import '../../state/providers.dart';
import '../../widgets/movie_card.dart';
import '../details/movie_details_screen.dart';

class MoodTab extends ConsumerStatefulWidget {
  const MoodTab({super.key});

  @override
  ConsumerState<MoodTab> createState() => _MoodTabState();
}

class _MoodTabState extends ConsumerState<MoodTab> {
  final Set<String> _selectedMoods = <String>{};
  Movie? _selectedMovie;
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final moods = ref.watch(moodsProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Выберите настроение',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: moods
                        .map((mood) {
                          final selected = _selectedMoods.contains(mood);
                          return FilterChip(
                            label: Text(mood),
                            selected: selected,
                            onSelected: (value) {
                              setState(() {
                                if (value) {
                                  _selectedMoods.add(mood);
                                } else {
                                  _selectedMoods.remove(mood);
                                }
                              });
                            },
                          );
                        })
                        .toList(growable: false),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _loading ? null : _pickMovie,
                      icon: _loading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.auto_awesome),
                      label: const Text('Подобрать фильм'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_selectedMoods.isNotEmpty)
                    Text(
                      'Выбрано: ${_selectedMoods.join(', ')}',
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                  const SizedBox(height: 12),
                  if (_selectedMovie != null)
                    Stack(
                      children: [
                        MovieCard(
                          movie: _selectedMovie!,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => MovieDetailsScreen(
                                  movieId: _selectedMovie!.id,
                                ),
                              ),
                            );
                          },
                        ),
                        Positioned(
                          top: 12,
                          right: 12,
                          child: IconButton.filledTonal(
                            onPressed: () async {
                              final current = _selectedMovie;
                              if (current == null) {
                                return;
                              }
                              await ref
                                  .read(movieRepositoryProvider)
                                  .toggleFavorite(current.id);
                              final refreshed = await ref
                                  .read(movieRepositoryProvider)
                                  .getById(current.id);
                              if (refreshed != null) {
                                setState(() => _selectedMovie = refreshed);
                              }
                              ref
                                  .read(movieRefreshTriggerProvider.notifier)
                                  .state++;
                            },
                            icon: Icon(
                              _selectedMovie!.isFavorite
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                              color: _selectedMovie!.isFavorite
                                  ? AppTheme.accent
                                  : AppTheme.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    )
                  else
                    const Text(
                      'После выбора настроения покажем случайный фильм.',
                      style: TextStyle(color: AppTheme.textSecondary),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickMovie() async {
    if (_selectedMoods.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Выберите хотя бы одно настроение')),
      );
      return;
    }

    setState(() => _loading = true);
    final movie = await ref
        .read(movieRepositoryProvider)
        .getRandomByMood(_selectedMoods.toList(growable: false));
    if (!mounted) {
      return;
    }
    setState(() {
      _selectedMovie = movie;
      _loading = false;
    });

    if (movie == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Подходящих фильмов не найдено')),
      );
    }
  }
}
