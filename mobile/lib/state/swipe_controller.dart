import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/movie_repository.dart';
import '../domain/movie.dart';

enum SwipeDirection { like, dislike }

class SwipeAction {
  const SwipeAction({
    required this.movie,
    required this.direction,
    required this.wasFavorite,
  });

  final Movie movie;
  final SwipeDirection direction;
  final bool wasFavorite;
}

class SwipeState {
  const SwipeState({
    required this.stack,
    required this.history,
    required this.isLoading,
  });

  factory SwipeState.initial() {
    return const SwipeState(
      stack: <Movie>[],
      history: <SwipeAction>[],
      isLoading: true,
    );
  }

  final List<Movie> stack;
  final List<SwipeAction> history;
  final bool isLoading;

  SwipeState copyWith({
    List<Movie>? stack,
    List<SwipeAction>? history,
    bool? isLoading,
  }) {
    return SwipeState(
      stack: stack ?? this.stack,
      history: history ?? this.history,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class SwipeController extends StateNotifier<SwipeState> {
  SwipeController(this._repository, this._touchMovieData)
    : super(SwipeState.initial()) {
    loadInitial();
  }

  final MovieRepository _repository;
  final void Function() _touchMovieData;

  Future<void> loadInitial() async {
    state = state.copyWith(isLoading: true);
    final stack = await _repository.getRandomStack(count: 20);
    state = SwipeState(
      stack: stack,
      history: const <SwipeAction>[],
      isLoading: false,
    );
  }

  Future<void> swipeTop(SwipeDirection direction) async {
    if (state.stack.isEmpty) {
      return;
    }

    final topMovie = state.stack.first;
    final remaining = state.stack.skip(1).toList(growable: false);
    final wasFavorite = topMovie.isFavorite;

    if (direction == SwipeDirection.like) {
      await _repository.setFavorite(topMovie.id, true);
      _touchMovieData();
    }

    final action = SwipeAction(
      movie: topMovie,
      direction: direction,
      wasFavorite: wasFavorite,
    );

    state = state.copyWith(
      stack: remaining,
      history: [...state.history, action],
    );
  }

  Future<bool> undo() async {
    if (state.history.isEmpty) {
      return false;
    }

    final actions = List<SwipeAction>.from(state.history);
    final last = actions.removeLast();

    if (last.direction == SwipeDirection.like && !last.wasFavorite) {
      await _repository.setFavorite(last.movie.id, false);
      _touchMovieData();
    }

    final restored = last.movie.copyWith(isFavorite: last.wasFavorite);
    state = state.copyWith(stack: [restored, ...state.stack], history: actions);
    return true;
  }
}
