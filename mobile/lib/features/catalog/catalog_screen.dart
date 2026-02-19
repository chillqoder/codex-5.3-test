import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/movie_filters.dart';
import '../../domain/movie.dart';
import '../../state/providers.dart';
import '../../widgets/movie_card.dart';
import '../details/movie_details_screen.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  final TextEditingController _queryController = TextEditingController();

  String? _selectedGenre;
  String? _selectedMood;
  double _minRating = 0;
  int _maxDuration = 240;

  @override
  void initState() {
    super.initState();
    _queryController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final moviesAsync = ref.watch(allMoviesProvider);
    final genres = ref.watch(genresProvider);
    final moods = ref.watch(moodsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Каталог')),
      body: moviesAsync.when(
        data: (movies) {
          final filtered = _applyFilters(movies);

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: TextField(
                  controller: _queryController,
                  decoration: InputDecoration(
                    hintText: 'Поиск по названию, актеру, режиссеру',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _queryController.text.isNotEmpty
                        ? IconButton(
                            onPressed: () {
                              _queryController.clear();
                              setState(() {});
                            },
                            icon: const Icon(Icons.clear),
                          )
                        : null,
                  ),
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    _dropdownFilter(
                      label: 'Жанр',
                      value: _selectedGenre,
                      values: genres,
                      onChanged: (value) =>
                          setState(() => _selectedGenre = value),
                    ),
                    const SizedBox(width: 10),
                    _dropdownFilter(
                      label: 'Настроение',
                      value: _selectedMood,
                      values: moods,
                      onChanged: (value) =>
                          setState(() => _selectedMood = value),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Text('Мин. рейтинг'),
                        const Spacer(),
                        Text(_minRating.toStringAsFixed(1)),
                      ],
                    ),
                    Slider(
                      value: _minRating,
                      min: 0,
                      max: 10,
                      divisions: 20,
                      onChanged: (value) {
                        setState(() => _minRating = value);
                      },
                    ),
                    Row(
                      children: [
                        const Text('Макс. длительность'),
                        const Spacer(),
                        Text('$_maxDuration мин'),
                      ],
                    ),
                    Slider(
                      value: _maxDuration.toDouble(),
                      min: 60,
                      max: 240,
                      divisions: 18,
                      onChanged: (value) {
                        setState(() => _maxDuration = value.round());
                      },
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 6,
                ),
                child: Row(
                  children: [
                    Text(
                      'Найдено: ${filtered.length}',
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: _resetFilters,
                      icon: const Icon(Icons.restart_alt),
                      label: const Text('Сбросить'),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: filtered.isEmpty
                    ? const Center(child: Text('Ничего не найдено'))
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final movie = filtered[index];
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
                                        .toggleFavorite(movie.id);
                                    ref
                                        .read(
                                          movieRefreshTriggerProvider.notifier,
                                        )
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
                              ),
                            ],
                          );
                        },
                      ),
              ),
            ],
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
    );
  }

  Widget _dropdownFilter({
    required String label,
    required String? value,
    required List<String> values,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(10),
      ),
      child: DropdownButton<String>(
        value: value,
        hint: Text(label),
        underline: const SizedBox.shrink(),
        items: [
          DropdownMenuItem<String>(value: null, child: Text('Любой $label')),
          ...values.map(
            (item) => DropdownMenuItem<String>(value: item, child: Text(item)),
          ),
        ],
        onChanged: onChanged,
      ),
    );
  }

  List<Movie> _applyFilters(List<Movie> movies) {
    return MovieFilters.searchAndFilter(
      movies,
      query: _queryController.text,
      genre: _selectedGenre,
      minRating: _minRating,
      maxDuration: _maxDuration,
      mood: _selectedMood,
    );
  }

  void _resetFilters() {
    setState(() {
      _selectedGenre = null;
      _selectedMood = null;
      _minRating = 0;
      _maxDuration = 240;
      _queryController.clear();
    });
  }
}
