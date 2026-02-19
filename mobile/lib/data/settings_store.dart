import 'package:hive/hive.dart';

abstract class SettingsStore {
  Future<void> init();
  Set<String> getFavoriteIds();
  Future<void> saveFavoriteIds(Set<String> ids);
  String getThemeMode();
  Future<void> saveThemeMode(String mode);
}

class HiveSettingsStore implements SettingsStore {
  HiveSettingsStore({
    this.boxName = 'movie_swipe_settings',
    this.favoritesKey = 'favorite_ids',
    this.themeKey = 'theme_mode',
  });

  final String boxName;
  final String favoritesKey;
  final String themeKey;

  late Box<dynamic> _box;

  @override
  Future<void> init() async {
    _box = await Hive.openBox<dynamic>(boxName);
  }

  @override
  Set<String> getFavoriteIds() {
    final raw = _box.get(favoritesKey, defaultValue: <dynamic>[]);
    if (raw is List) {
      return raw.map((item) => '$item').toSet();
    }
    return <String>{};
  }

  @override
  Future<void> saveFavoriteIds(Set<String> ids) async {
    await _box.put(favoritesKey, ids.toList(growable: false));
  }

  @override
  String getThemeMode() {
    final raw = _box.get(themeKey, defaultValue: 'dark');
    return '$raw';
  }

  @override
  Future<void> saveThemeMode(String mode) async {
    await _box.put(themeKey, mode);
  }
}

class InMemorySettingsStore implements SettingsStore {
  Set<String> _favoriteIds = <String>{};
  String _themeMode = 'dark';

  @override
  Future<void> init() async {}

  @override
  Set<String> getFavoriteIds() => Set<String>.from(_favoriteIds);

  @override
  String getThemeMode() => _themeMode;

  @override
  Future<void> saveFavoriteIds(Set<String> ids) async {
    _favoriteIds = Set<String>.from(ids);
  }

  @override
  Future<void> saveThemeMode(String mode) async {
    _themeMode = mode;
  }
}
