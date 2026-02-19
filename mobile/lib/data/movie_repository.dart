import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/utils/movie_filters.dart';
import '../domain/movie.dart';
import 'settings_store.dart';

class MovieRepository {
  MovieRepository({
    AssetBundle? assetBundle,
    SettingsStore? settingsStore,
    this.moviesAssetPath = 'assets/movies.json',
    List<Movie>? seedMovies,
  }) : _assetBundle = assetBundle ?? rootBundle,
       _settingsStore = settingsStore ?? HiveSettingsStore(),
       _seedMovies = seedMovies;

  final AssetBundle _assetBundle;
  final SettingsStore _settingsStore;
  final String moviesAssetPath;
  final List<Movie>? _seedMovies;
  final Random _random = Random();

  List<Movie> _baseMovies = const <Movie>[];
  Set<String> _favoriteIds = <String>{};

  Future<void> init() async {
    await _settingsStore.init();
    _favoriteIds = _settingsStore.getFavoriteIds();

    final seedMovies = _seedMovies;
    if (seedMovies != null) {
      _baseMovies = List<Movie>.from(seedMovies);
      return;
    }

    final jsonString = await _assetBundle.loadString(moviesAssetPath);
    final decoded = jsonDecode(jsonString);

    if (decoded is! List) {
      throw const FormatException('Movies JSON must contain an array.');
    }

    _baseMovies = decoded
        .map((item) => Movie.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  List<Movie> _applyUserState(Iterable<Movie> movies) {
    return movies
        .map(
          (movie) =>
              movie.copyWith(isFavorite: _favoriteIds.contains(movie.id)),
        )
        .toList(growable: false);
  }

  Future<List<Movie>> loadAll() async {
    return _applyUserState(_baseMovies);
  }

  Future<Movie?> getById(String id) async {
    try {
      final movie = _baseMovies.firstWhere((item) => item.id == id);
      return movie.copyWith(isFavorite: _favoriteIds.contains(id));
    } catch (_) {
      return null;
    }
  }

  Future<List<Movie>> getRandomStack({int count = 20}) async {
    final movies = _applyUserState(_baseMovies);
    final shuffled = List<Movie>.from(movies)..shuffle(_random);
    final safeCount = count.clamp(0, shuffled.length);
    return shuffled.take(safeCount).toList(growable: false);
  }

  Future<Movie?> getRandomByMood(List<String> moods) async {
    final normalized = moods.map((mood) => mood.toLowerCase()).toSet();
    if (normalized.isEmpty) {
      return null;
    }

    final filtered = _applyUserState(_baseMovies)
        .where((movie) {
          final movieMoods = movie.moods
              .map((item) => item.toLowerCase())
              .toSet();
          return movieMoods.intersection(normalized).isNotEmpty;
        })
        .toList(growable: false);

    if (filtered.isEmpty) {
      return null;
    }

    return filtered[_random.nextInt(filtered.length)];
  }

  Future<List<Movie>> search(String query) async {
    return MovieFilters.searchAndFilter(
      _applyUserState(_baseMovies),
      query: query,
    );
  }

  Future<void> toggleFavorite(String id) async {
    final isFavorite = _favoriteIds.contains(id);
    await setFavorite(id, !isFavorite);
  }

  Future<void> setFavorite(String id, bool isFavorite) async {
    if (isFavorite) {
      _favoriteIds.add(id);
    } else {
      _favoriteIds.remove(id);
    }
    await _settingsStore.saveFavoriteIds(_favoriteIds);
  }

  Future<List<Movie>> getFavorites() async {
    return _applyUserState(
      _baseMovies,
    ).where((movie) => movie.isFavorite).toList(growable: false);
  }

  Future<void> updateMovie(Movie movie) async {
    final index = _baseMovies.indexWhere((item) => item.id == movie.id);
    if (index == -1) {
      return;
    }
    final updated = List<Movie>.from(_baseMovies);
    updated[index] = movie.copyWith(
      isFavorite: _favoriteIds.contains(movie.id),
    );
    _baseMovies = updated;
  }

  Future<List<Movie>> filterCatalog({
    String query = '',
    String? genre,
    double minRating = 0,
    int maxDuration = 1000,
    String? mood,
  }) async {
    return MovieFilters.searchAndFilter(
      _applyUserState(_baseMovies),
      query: query,
      genre: genre,
      minRating: minRating,
      maxDuration: maxDuration,
      mood: mood,
    );
  }

  List<String> getAllGenres() {
    final genres =
        _baseMovies
            .expand((movie) => movie.genres)
            .toSet()
            .toList(growable: false)
          ..sort((a, b) => a.compareTo(b));
    return genres;
  }

  List<String> getAllMoods() {
    final moods =
        _baseMovies
            .expand((movie) => movie.moods)
            .toSet()
            .toList(growable: false)
          ..sort((a, b) => a.compareTo(b));
    return moods;
  }

  ThemeMode loadThemeMode() {
    final raw = _settingsStore.getThemeMode();
    switch (raw) {
      case 'light':
        return ThemeMode.light;
      case 'system':
        return ThemeMode.system;
      case 'dark':
      default:
        return ThemeMode.dark;
    }
  }

  Future<void> saveThemeMode(ThemeMode mode) async {
    switch (mode) {
      case ThemeMode.light:
        await _settingsStore.saveThemeMode('light');
      case ThemeMode.system:
        await _settingsStore.saveThemeMode('system');
      case ThemeMode.dark:
        await _settingsStore.saveThemeMode('dark');
    }
  }
}
