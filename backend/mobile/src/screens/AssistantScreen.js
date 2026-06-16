import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { chatWithAssistant, transcribeAudio } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const SUGGESTIONS = [
  "How much did I spend this month?",
  "What's my most expensive category?",
  "Where did I buy the cheapest groceries?"
];

// Static styles for TypingDots (no theme dependency)
const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { fontSize: 10, marginRight: 3 },
});

function TypingDots({ colors }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 200);
    const anim3 = animate(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const getOpacity = (anim) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  });

  return (
    <View style={dotStyles.row}>
      <Animated.Text style={[dotStyles.dot, { color: colors.textMuted }, getOpacity(dot1)]}>●</Animated.Text>
      <Animated.Text style={[dotStyles.dot, { color: colors.textMuted }, getOpacity(dot2)]}>●</Animated.Text>
      <Animated.Text style={[dotStyles.dot, { color: colors.textMuted }, getOpacity(dot3)]}>●</Animated.Text>
    </View>
  );
}

export default function AssistantScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);

  const scrollViewRef = useRef(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Welcome message on first mount
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm your spending assistant 👋 I have access to all your receipts and can answer questions like:\n- Where did you buy the cheapest milk?\n- How much did you spend on groceries this month?\n- Who in the family spends the most on fast food?\n\nAsk me anything about your spending!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isWelcome: true,
      },
    ]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setHasSentMessage(true);

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .filter(m => !m.isWelcome)
      .map(m => ({ role: m.role, content: m.text }));

    try {
      const response = await chatWithAssistant(text.trim(), history);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "Sorry, I couldn't reach the server. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Speech.stop();
    setIsSpeaking(false);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm your spending assistant 👋 I have access to all your receipts and can answer questions like:\n- Where did you buy the cheapest milk?\n- How much did you spend on groceries this month?\n- Who in the family spends the most on fast food?\n\nAsk me anything about your spending!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isWelcome: true,
      },
    ]);
    setHasSentMessage(false);
  };

  const readAloud = (text) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const startRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);

      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
      });

      const uri = recorder.uri;
      if (!uri) {
        setIsTranscribing(false);
        return;
      }

      const ext = uri.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'wav' ? 'audio/wav'
        : ext === 'amr' ? 'audio/amr'
        : ext === 'mp3' ? 'audio/mpeg'
        : ext === 'ogg' ? 'audio/ogg'
        : 'audio/mp4';

      const text = await transcribeAudio(uri, mimeType);
      setIsTranscribing(false);

      if (text) {
        setInputText(text);
        if (text.length < 100) {
          setTimeout(() => sendMessage(text), 300);
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSuggestionTap = (text) => {
    setInputText(text);
  };

  const renderMessageBubble = (msg) => {
    const isUser = msg.role === 'user';
    const isAssistant = msg.role === 'assistant';
    const isError = msg.isError;

    return (
      <View key={msg.id} style={[s.bubbleRow, isUser ? s.userRow : s.assistantRow]}>
        <View
          style={[
            s.bubble,
            isUser ? s.userBubble : s.assistantBubble,
            isError && s.errorBubble,
          ]}
        >
          <Text style={[s.bubbleText, isUser ? s.userBubbleText : s.assistantBubbleText]}>
            {msg.text}
          </Text>
          {isAssistant && !msg.isWelcome && (
            <TouchableOpacity
              style={s.readAloudButton}
              onPress={() => readAloud(msg.text)}
            >
              <Ionicons
                name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={s.readAloudText}>Read aloud</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[s.timestamp, isUser ? s.userTimestamp : s.assistantTimestamp]}>
          {msg.timestamp}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>Assistant</Text>
        <TouchableOpacity onPress={clearChat} style={s.clearButton}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={s.messagesContainer}
        contentContainerStyle={s.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessageBubble)}

        {isLoading && (
          <View key="loading" style={[s.bubbleRow, s.assistantRow]}>
            <View style={[s.bubble, s.assistantBubble, s.loadingBubble]}>
              <TypingDots colors={colors} />
            </View>
          </View>
        )}

        {!hasSentMessage && (
          <View style={s.suggestionsContainer}>
            {SUGGESTIONS.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={s.suggestionChip}
                onPress={() => handleSuggestionTap(suggestion)}
              >
                <Text style={s.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {(isRecording || isSpeaking || isTranscribing) && (
        <View style={s.voiceStatusBar}>
          {isRecording ? (
            <Text style={s.voiceStatusText}>🎙️ Recording... (tap mic to stop)</Text>
          ) : isTranscribing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color={colors.warning} />
              <Text style={s.voiceStatusText}>Transcribing...</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { Speech.stop(); setIsSpeaking(false); }}>
              <Text style={s.voiceStatusText}>🔊 Speaking... (tap to stop)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={s.inputContainer}>
        <TouchableOpacity
          style={[s.micButton, (isRecording || isTranscribing) && s.micButtonActive]}
          onPress={toggleRecording}
          disabled={isTranscribing}
        >
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={24}
            color={isRecording ? colors.danger : colors.textSecondary}
          />
        </TouchableOpacity>

        <TextInput
          style={s.textInput}
          placeholder="Ask about your spending..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable={!isLoading && !isRecording}
          maxLength={1000}
        />

        <TouchableOpacity
          style={[s.sendButton, (!inputText.trim() || isLoading) && s.sendButtonDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={!inputText.trim() || isLoading ? colors.textMuted : 'white'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: c.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  bubbleRow: {
    marginBottom: 16,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: c.accent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: c.cardBg,
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: c.dangerLight,
  },
  loadingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userBubbleText: {
    color: 'white',
  },
  assistantBubbleText: {
    color: c.text,
  },
  timestamp: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 4,
    marginHorizontal: 4,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  assistantTimestamp: {
    textAlign: 'left',
  },
  readAloudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  readAloudText: {
    fontSize: 12,
    color: c.textSecondary,
    marginLeft: 4,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16,
  },
  suggestionChip: {
    backgroundColor: c.accentLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: c.accent,
    fontWeight: '500',
  },
  voiceStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: c.warningLight,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  voiceStatusText: {
    fontSize: 13,
    color: c.warning,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.bg,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  micButtonActive: {
    backgroundColor: c.dangerLight,
  },
  textInput: {
    flex: 1,
    backgroundColor: c.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: c.text,
    borderWidth: 1,
    borderColor: c.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: c.border,
  },
});
