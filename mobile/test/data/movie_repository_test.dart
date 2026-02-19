import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:movieswipe/data/movie_repository.dart';
import 'package:movieswipe/data/settings_store.dart';
import 'package:movieswipe/domain/movie.dart';

void main() {
  late MovieRepository repository;

  final seedMovies = [
    Movie(
      id: 'movie_1',
      title: 'Веселый фильм',
      originalTitle: 'Funny Movie',
      year: 2023,
      description: 'Описание 1',
      genres: const ['comedy'],
      moods: const ['funny', 'light'],
      rating: 7.2,
      duration: 100,
      director: 'Режиссер 1',
      cast: const ['Актер А'],
      poster: '',
      backdrop: '',
      language: 'ru',
      tags: const ['смех'],
      watchStatus: 'unwatched',
      isFavorite: false,
      tmdbId: null,
      createdAt: DateTime.utc(2025, 1, 1),
    ),
    Movie(
      id: 'movie_2',
      title: 'Серьезный фильм',
      originalTitle: 'Serious Movie',
      year: 2024,
      description: 'Описание 2',
      genres: const ['drama'],
      moods: const ['dark', 'tense'],
      rating: 8.8,
      duration: 140,
      director: 'Режиссер 2',
      cast: const ['Актер Б'],
      poster: '',
      backdrop: '',
      language: 'ru',
      tags: const ['драма'],
      watchStatus: 'unwatched',
      isFavorite: false,
      tmdbId: null,
      createdAt: DateTime.utc(2025, 1, 2),
    ),
  ];

  setUp(() async {
    repository = MovieRepository(
      seedMovies: seedMovies,
      settingsStore: InMemorySettingsStore(),
    );
    await repository.init();
  });

  test('loads movies and retrieves by id', () async {
    final all = await repository.loadAll();
    expect(all.length, 2);

    final movie = await repository.getById('movie_2');
    expect(movie?.title, 'Серьезный фильм');
  });

  test('persists favorite toggles and getFavorites', () async {
    await repository.setFavorite('movie_1', true);
    var favorites = await repository.getFavorites();
    expect(favorites.map((movie) => movie.id), ['movie_1']);

    await repository.toggleFavorite('movie_1');
    favorites = await repository.getFavorites();
    expect(favorites, isEmpty);
  });

  test('returns random match by mood and supports search', () async {
    final random = await repository.getRandomByMood(['tense']);
    expect(random?.id, 'movie_2');

    final result = await repository.search('funny');
    expect(result.length, 1);
    expect(result.first.id, 'movie_1');
  });

  test('stores and loads theme mode', () async {
    expect(repository.loadThemeMode(), ThemeMode.dark);

    await repository.saveThemeMode(ThemeMode.light);
    expect(repository.loadThemeMode(), ThemeMode.light);

    await repository.saveThemeMode(ThemeMode.system);
    expect(repository.loadThemeMode(), ThemeMode.system);
  });
}
