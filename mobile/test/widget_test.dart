import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:movieswipe/app/movie_swipe_app.dart';
import 'package:movieswipe/data/movie_repository.dart';
import 'package:movieswipe/data/settings_store.dart';
import 'package:movieswipe/domain/movie.dart';
import 'package:movieswipe/state/providers.dart';

void main() {
  testWidgets('shows main navigation tabs in Russian', (tester) async {
    final repository = MovieRepository(
      seedMovies: [
        Movie(
          id: 'm1',
          title: 'Тестовый фильм',
          originalTitle: null,
          year: 2025,
          description: 'Описание',
          genres: const ['drama'],
          moods: const ['calm'],
          rating: 7.5,
          duration: 120,
          director: 'Режиссер',
          cast: const ['Актер'],
          poster: '',
          backdrop: '',
          language: 'ru',
          tags: const ['тест'],
          watchStatus: 'unwatched',
          isFavorite: false,
          tmdbId: null,
          createdAt: DateTime.utc(2025, 1, 1),
        ),
      ],
      settingsStore: InMemorySettingsStore(),
    );
    await repository.init();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [movieRepositoryProvider.overrideWithValue(repository)],
        child: const MovieSwipeApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Свайп'), findsOneWidget);
    expect(find.text('Настроение'), findsOneWidget);
    expect(find.text('Избранное'), findsOneWidget);
    expect(find.text('Профиль'), findsOneWidget);
  });
}
