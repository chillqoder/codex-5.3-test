import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app/movie_swipe_app.dart';
import 'data/movie_repository.dart';
import 'state/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();

  final repository = MovieRepository();
  await repository.init();

  runApp(
    ProviderScope(
      overrides: [movieRepositoryProvider.overrideWithValue(repository)],
      child: const MovieSwipeApp(),
    ),
  );
}
