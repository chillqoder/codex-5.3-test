import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../state/providers.dart';
import '../../state/swipe_controller.dart';
import '../../widgets/movie_card.dart';
import '../details/movie_details_screen.dart';

class SwipeTab extends ConsumerWidget {
  const SwipeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(swipeControllerProvider);
    final controller = ref.read(swipeControllerProvider.notifier);

    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.stack.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Фильмы закончились в этой подборке'),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: controller.loadInitial,
              icon: const Icon(Icons.shuffle),
              label: const Text('Загрузить новую стопку'),
            ),
          ],
        ),
      );
    }

    final visible = min(3, state.stack.length);

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
      child: Column(
        children: [
          Expanded(
            child: Stack(
              children: List.generate(visible, (index) {
                final reverseIndex = visible - index - 1;
                final movie = state.stack[reverseIndex];
                final depth = reverseIndex;

                final card = MovieCard(
                  movie: movie,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => MovieDetailsScreen(movieId: movie.id),
                      ),
                    );
                  },
                );

                return AnimatedPositioned(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOut,
                  top: (depth * 10).toDouble(),
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Transform.scale(
                    scale: 1 - (depth * 0.04),
                    child: reverseIndex == 0
                        ? Dismissible(
                            key: ValueKey(
                              '${movie.id}_${state.history.length}',
                            ),
                            direction: DismissDirection.horizontal,
                            onDismissed: (direction) {
                              if (direction == DismissDirection.startToEnd) {
                                controller.swipeTop(SwipeDirection.like);
                              } else {
                                controller.swipeTop(SwipeDirection.dislike);
                              }
                            },
                            background: const _SwipeBackground(
                              color: AppTheme.accent,
                              icon: Icons.favorite,
                              label: 'Нравится',
                              alignment: Alignment.centerLeft,
                            ),
                            secondaryBackground: const _SwipeBackground(
                              color: AppTheme.error,
                              icon: Icons.close,
                              label: 'Пропустить',
                              alignment: Alignment.centerRight,
                            ),
                            child: card,
                          )
                        : IgnorePointer(child: card),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              IconButton.filledTonal(
                iconSize: 34,
                onPressed: () => controller.swipeTop(SwipeDirection.dislike),
                icon: const Icon(Icons.thumb_down_alt_rounded),
              ),
              IconButton.filled(
                iconSize: 32,
                onPressed: () async {
                  final restored = await controller.undo();
                  if (!context.mounted || restored) {
                    return;
                  }
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Нечего отменять')),
                  );
                },
                icon: const Icon(Icons.undo),
              ),
              IconButton.filledTonal(
                iconSize: 34,
                onPressed: () => controller.swipeTop(SwipeDirection.like),
                icon: const Icon(Icons.thumb_up_alt_rounded),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SwipeBackground extends StatelessWidget {
  const _SwipeBackground({
    required this.color,
    required this.icon,
    required this.label,
    required this.alignment,
  });

  final Color color;
  final IconData icon;
  final String label;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.22),
        borderRadius: BorderRadius.circular(16),
      ),
      alignment: alignment,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
