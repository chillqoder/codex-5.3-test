import 'package:flutter_test/flutter_test.dart';
import 'package:movieswipe/core/utils/movie_filters.dart';
import 'package:movieswipe/domain/movie.dart';

void main() {
  final movies = [
    Movie(
      id: '1',
      title: 'Комедия про друзей',
      originalTitle: 'Friends Comedy',
      year: 2024,
      description: 'Описание',
      genres: const ['comedy'],
      moods: const ['funny', 'light'],
      rating: 7.9,
      duration: 98,
      director: 'Иван Петров',
      cast: const ['Актер 1', 'Актер 2'],
      poster: '',
      backdrop: '',
      language: 'ru',
      tags: const ['вечер', 'легкий'],
      watchStatus: 'unwatched',
      isFavorite: false,
      tmdbId: null,
      createdAt: DateTime.utc(2025, 1, 1),
    ),
    Movie(
      id: '2',
      title: 'Космическая драма',
      originalTitle: 'Space Drama',
      year: 2023,
      description: 'Описание',
      genres: const ['drama', 'sci-fi'],
      moods: const ['intense'],
      rating: 8.6,
      duration: 155,
      director: 'Мария Сидорова',
      cast: const ['Актер 3'],
      poster: '',
      backdrop: '',
      language: 'ru',
      tags: const ['космос'],
      watchStatus: 'unwatched',
      isFavorite: false,
      tmdbId: null,
      createdAt: DateTime.utc(2025, 1, 2),
    ),
  ];

  test('filters by query in title/director/tags', () {
    final byTitle = MovieFilters.searchAndFilter(movies, query: 'друзей');
    expect(byTitle.map((movie) => movie.id), ['1']);

    final byDirector = MovieFilters.searchAndFilter(movies, query: 'сидорова');
    expect(byDirector.map((movie) => movie.id), ['2']);

    final byTag = MovieFilters.searchAndFilter(movies, query: 'космос');
    expect(byTag.map((movie) => movie.id), ['2']);
  });

  test('filters by genre, mood, rating and duration together', () {
    final result = MovieFilters.searchAndFilter(
      movies,
      genre: 'sci-fi',
      mood: 'intense',
      minRating: 8.0,
      maxDuration: 160,
    );

    expect(result.length, 1);
    expect(result.first.id, '2');
  });
}
