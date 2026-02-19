import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/movie_repository.dart';
import '../domain/movie.dart';
import 'swipe_controller.dart';

final movieRepositoryProvider = Provider<MovieRepository>((ref) {
  throw UnimplementedError(
    'movieRepositoryProvider must be overridden in main().',
  );
});

final movieRefreshTriggerProvider = StateProvider<int>((ref) => 0);

final allMoviesProvider = FutureProvider<List<Movie>>((ref) async {
  ref.watch(movieRefreshTriggerProvider);
  final repository = ref.watch(movieRepositoryProvider);
  return repository.loadAll();
});

final favoritesProvider = FutureProvider<List<Movie>>((ref) async {
  ref.watch(movieRefreshTriggerProvider);
  final repository = ref.watch(movieRepositoryProvider);
  return repository.getFavorites();
});

final movieByIdProvider = FutureProvider.family<Movie?, String>((
  ref,
  id,
) async {
  ref.watch(movieRefreshTriggerProvider);
  final repository = ref.watch(movieRepositoryProvider);
  return repository.getById(id);
});

final genresProvider = Provider<List<String>>((ref) {
  ref.watch(movieRefreshTriggerProvider);
  return ref.watch(movieRepositoryProvider).getAllGenres();
});

final moodsProvider = Provider<List<String>>((ref) {
  ref.watch(movieRefreshTriggerProvider);
  return ref.watch(movieRepositoryProvider).getAllMoods();
});

final themeModeProvider = StateNotifierProvider<ThemeModeController, ThemeMode>(
  (ref) {
    return ThemeModeController(ref.watch(movieRepositoryProvider));
  },
);

class ThemeModeController extends StateNotifier<ThemeMode> {
  ThemeModeController(this._repository) : super(_repository.loadThemeMode());

  final MovieRepository _repository;

  Future<void> update(ThemeMode mode) async {
    if (state == mode) {
      return;
    }
    state = mode;
    await _repository.saveThemeMode(mode);
  }
}

final swipeControllerProvider =
    StateNotifierProvider<SwipeController, SwipeState>((ref) {
      final repository = ref.watch(movieRepositoryProvider);
      return SwipeController(repository, () {
        ref.read(movieRefreshTriggerProvider.notifier).state++;
      });
    });
