class Movie {
  const Movie({
    required this.id,
    required this.title,
    this.originalTitle,
    required this.year,
    required this.description,
    required this.genres,
    required this.moods,
    required this.rating,
    required this.duration,
    required this.director,
    required this.cast,
    required this.poster,
    required this.backdrop,
    required this.language,
    required this.tags,
    required this.watchStatus,
    required this.isFavorite,
    this.tmdbId,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String? originalTitle;
  final int year;
  final String description;
  final List<String> genres;
  final List<String> moods;
  final double rating;
  final int duration;
  final String director;
  final List<String> cast;
  final String poster;
  final String backdrop;
  final String language;
  final List<String> tags;
  final String watchStatus;
  final bool isFavorite;
  final int? tmdbId;
  final DateTime createdAt;

  Movie copyWith({
    String? id,
    String? title,
    String? originalTitle,
    int? year,
    String? description,
    List<String>? genres,
    List<String>? moods,
    double? rating,
    int? duration,
    String? director,
    List<String>? cast,
    String? poster,
    String? backdrop,
    String? language,
    List<String>? tags,
    String? watchStatus,
    bool? isFavorite,
    int? tmdbId,
    DateTime? createdAt,
  }) {
    return Movie(
      id: id ?? this.id,
      title: title ?? this.title,
      originalTitle: originalTitle ?? this.originalTitle,
      year: year ?? this.year,
      description: description ?? this.description,
      genres: genres ?? this.genres,
      moods: moods ?? this.moods,
      rating: rating ?? this.rating,
      duration: duration ?? this.duration,
      director: director ?? this.director,
      cast: cast ?? this.cast,
      poster: poster ?? this.poster,
      backdrop: backdrop ?? this.backdrop,
      language: language ?? this.language,
      tags: tags ?? this.tags,
      watchStatus: watchStatus ?? this.watchStatus,
      isFavorite: isFavorite ?? this.isFavorite,
      tmdbId: tmdbId ?? this.tmdbId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory Movie.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value, {int fallback = 0}) {
      if (value is int) {
        return value;
      }
      if (value is double) {
        return value.round();
      }
      return int.tryParse('$value') ?? fallback;
    }

    double parseDouble(dynamic value, {double fallback = 0}) {
      if (value is double) {
        return value;
      }
      if (value is int) {
        return value.toDouble();
      }
      return double.tryParse('$value') ?? fallback;
    }

    List<String> parseStringList(dynamic value) {
      if (value is List) {
        return value.map((item) => '$item').toList(growable: false);
      }
      return const <String>[];
    }

    final createdAtRaw = json['created_at'];
    return Movie(
      id: '${json['id']}',
      title: '${json['title']}',
      originalTitle: json['original_title']?.toString(),
      year: parseInt(json['year']),
      description: '${json['description'] ?? ''}',
      genres: parseStringList(json['genres']),
      moods: parseStringList(json['moods']),
      rating: parseDouble(json['rating']),
      duration: parseInt(json['duration']),
      director: '${json['director'] ?? ''}',
      cast: parseStringList(json['cast']),
      poster: '${json['poster'] ?? ''}',
      backdrop: '${json['backdrop'] ?? ''}',
      language: '${json['language'] ?? 'ru'}',
      tags: parseStringList(json['tags']),
      watchStatus: '${json['watch_status'] ?? 'unwatched'}',
      isFavorite: json['is_favorite'] == true,
      tmdbId: json['tmdb_id'] is int ? json['tmdb_id'] as int : null,
      createdAt: createdAtRaw is String
          ? DateTime.tryParse(createdAtRaw) ??
                DateTime.fromMillisecondsSinceEpoch(0)
          : DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}
