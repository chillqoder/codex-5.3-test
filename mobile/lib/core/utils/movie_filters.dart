import '../../domain/movie.dart';

class MovieFilters {
  static List<Movie> searchAndFilter(
    List<Movie> movies, {
    String query = '',
    String? genre,
    double minRating = 0,
    int maxDuration = 1000,
    String? mood,
  }) {
    final normalizedQuery = query.trim().toLowerCase();

    bool matchesQuery(Movie movie) {
      if (normalizedQuery.isEmpty) {
        return true;
      }

      final haystack = <String>[
        movie.title,
        movie.originalTitle ?? '',
        movie.director,
        ...movie.cast,
        ...movie.tags,
      ].join(' ').toLowerCase();

      return haystack.contains(normalizedQuery);
    }

    bool matchesGenre(Movie movie) {
      if (genre == null || genre.isEmpty) {
        return true;
      }
      return movie.genres.any(
        (item) => item.toLowerCase() == genre.toLowerCase(),
      );
    }

    bool matchesMood(Movie movie) {
      if (mood == null || mood.isEmpty) {
        return true;
      }
      return movie.moods.any(
        (item) => item.toLowerCase() == mood.toLowerCase(),
      );
    }

    return movies
        .where((movie) {
          return matchesQuery(movie) &&
              matchesGenre(movie) &&
              matchesMood(movie) &&
              movie.rating >= minRating &&
              movie.duration <= maxDuration;
        })
        .toList(growable: false);
  }
}
