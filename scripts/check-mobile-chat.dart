import 'dart:io';
import '../petmeta_mobile/lib/dog_chat_api.dart';

Future<void> main() async {
  DogChatApi.sessionKey = Platform.environment['PETMETA_TEST_GROQ_KEY'] ?? '';
  final api = DogChatApi();
  try {
    var answer = '';
    await for (final chunk in api.reply([
      {'role': 'user', 'content': 'Give me two short everyday dog care tips.'},
    ])) {
      answer += chunk;
    }
    if (answer.trim().isEmpty) throw StateError('Empty live answer');
    stdout.writeln('Live app chat reply verified (${answer.length} characters).');
  } finally {
    api.close();
    DogChatApi.sessionKey = '';
  }
}
