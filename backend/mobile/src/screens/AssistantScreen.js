import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {
  useAudioRecorder, RecordingPresets,
  requestRecordingPermissionsAsync, setAudioModeAsync,
} from 'expo-audio';
import { chatWithAssistant, transcribeAudio } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT } from '../constants/design';

const SUGGESTIONS = [
  "How much did I spend this month?",
  "What's my most expensive category?",
  "Where did I buy the cheapest groceries?",
];

// ── Typing dots ──

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dot: { fontSize: 10 },
});

function TypingDots({ colors }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const getOpacity = (anim) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
  });

  return (
    <View style={dotStyles.row}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.Text key={i} style={[dotStyles.dot, { color: colors.textMuted }, getOpacity(d)]}>
          ●
        </Animated.Text>
      ))}
    </View>
  );
}

// ── Screen ──

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

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm your spending assistant. I have access to all your receipts and can answer questions like:\n\n- Where did you buy the cheapest milk?\n- How much did you spend on groceries this month?\n- Who in the family spends the most on fast food?\n\nAsk me anything about your spending!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isWelcome: true,
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setHasSentMessage(true);

    const history = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && !m.isWelcome)
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const response = await chatWithAssistant(text.trim(), history);
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: "Sorry, I couldn't reach the server. Please check your connection and try again.",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const clearChat = () => {
    Speech.stop();
    setIsSpeaking(false);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm your spending assistant. I have access to all your receipts and can answer questions like:\n\n- Where did you buy the cheapest milk?\n- How much did you spend on groceries this month?\n- Who in the family spends the most on fast food?\n\nAsk me anything about your spending!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isWelcome: true,
      },
    ]);
    setHasSentMessage(false);
  };

  const readAloud = (text) => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); return; }
    setIsSpeaking(true);
    Speech.speak(text, { language: 'en-US', rate: 0.9, onDone: () => setIsSpeaking(false), onError: () => setIsSpeaking(false) });
  };

  const startRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
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
      await setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;
      if (!uri) { setIsTranscribing(false); return; }
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
        if (text.length < 100) setTimeout(() => sendMessage(text), 300);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => { isRecording ? stopRecording() : startRecording(); };
  const handleSuggestionTap = (text) => setInputText(text);

  // ── Render ──

  const renderMessageBubble = (msg) => {
    const isUser = msg.role === 'user';
    const isAssistant = msg.role === 'assistant';
    return (
      <View key={msg.id} style={[s.bubbleRow, isUser ? s.userRow : s.assistantRow]}>
        <View style={[s.bubble, isUser ? s.userBubble : s.assistantBubble, msg.isError && s.errorBubble]}>
          <Text style={[s.bubbleText, isUser && s.userBubbleText]}>{msg.text}</Text>
          {isAssistant && !msg.isWelcome && (
            <TouchableOpacity style={s.readAloudBtn} onPress={() => readAloud(msg.text)}>
              <Ionicons name={isSpeaking ? 'volume-high' : 'volume-medium-outline'} size={14} color={colors.textSecondary} />
              <Text style={s.readAloudText}>Listen</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[s.timestamp, isUser ? s.userTimestamp : s.assistantTimestamp]}>{msg.timestamp}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Assistant</Text>
          <Text style={s.headerSubtitle}>Ask about your spending</Text>
        </View>
        {hasSentMessage && (
          <TouchableOpacity onPress={clearChat} style={s.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={s.messagesContainer}
        contentContainerStyle={s.messagesContent}
        showsVerticalScrollIndicator={false}
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
          <View style={s.suggestionsWrap}>
            {SUGGESTIONS.map((text, i) => (
              <TouchableOpacity key={i} style={[s.suggestionChip, { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => handleSuggestionTap(text)}>
                <Text style={[s.suggestionText, { color: colors.accent }]}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Voice status bar */}
      {(isRecording || isSpeaking || isTranscribing) && (
        <View style={[s.voiceBar, { backgroundColor: colors.warningLight, borderTopColor: colors.border }]}>
          {isRecording ? (
            <Text style={[s.voiceText, { color: colors.danger }]}>Recording... (tap mic to stop)</Text>
          ) : isTranscribing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color={colors.warning} />
              <Text style={[s.voiceText, { color: colors.warning }]}>Transcribing...</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { Speech.stop(); setIsSpeaking(false); }}>
              <Text style={[s.voiceText, { color: colors.warning }]}>Speaking... (tap to stop)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Input bar */}
      <View style={[s.inputBar, { backgroundColor: colors.cardBg, borderTopColor: colors.divider }]}>
        <TouchableOpacity style={[s.micBtn, { borderColor: colors.border }, (isRecording || isTranscribing) && s.micBtnActive]} onPress={toggleRecording} disabled={isTranscribing}>
          <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={22} color={isRecording ? colors.danger : colors.textSecondary} />
        </TouchableOpacity>

        <TextInput
          style={[s.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          placeholder="Ask about your spending..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable={!isLoading && !isRecording}
          maxLength={1000}
        />

        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: inputText.trim() && !isLoading ? colors.accent : colors.border }]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={18} color={!inputText.trim() || isLoading ? colors.textMuted : '#FFFFFF'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },

    // ── Header ──
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      paddingTop: Platform.OS === 'ios' ? 64 : 48,
      paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
      backgroundColor: c.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.divider,
    },
    headerTitle: { fontSize: FONT.sizes.title, fontWeight: FONT.weights.bold, color: c.text },
    headerSubtitle: { fontSize: FONT.sizes.body, color: c.textSecondary, marginTop: 2 },
    clearBtn: { padding: SPACING.sm, marginTop: 2 },

    // ── Messages ──
    messagesContainer: { flex: 1 },
    messagesContent: { padding: SPACING.lg, paddingBottom: SPACING.sm },

    bubbleRow: { marginBottom: SPACING.md },
    userRow: { alignItems: 'flex-end' },
    assistantRow: { alignItems: 'flex-start' },

    bubble: {
      maxWidth: '82%', borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    },
    userBubble: {
      backgroundColor: c.accent,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: c.cardBg,
      borderBottomLeftRadius: 4,
    },
    errorBubble: { backgroundColor: c.dangerLight },
    loadingBubble: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },

    bubbleText: {
      fontSize: FONT.sizes.body, lineHeight: 21, color: c.text,
    },
    userBubbleText: { color: '#FFFFFF' },

    timestamp: { fontSize: 10, color: c.textMuted, marginTop: 4, marginHorizontal: 4 },
    userTimestamp: { textAlign: 'right' },
    assistantTimestamp: { textAlign: 'left' },

    readAloudBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      marginTop: SPACING.sm, paddingTop: SPACING.sm,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border,
    },
    readAloudText: { fontSize: FONT.sizes.caption, color: c.textSecondary },

    // ── Suggestions ──
    suggestionsWrap: {
      flexDirection: 'row', flexWrap: 'wrap',
      marginTop: SPACING.sm, marginBottom: SPACING.lg,
    },
    suggestionChip: {
      borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
      marginRight: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1,
    },
    suggestionText: { fontSize: FONT.sizes.label, fontWeight: FONT.weights.medium },

    // ── Voice status ──
    voiceBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth,
    },
    voiceText: { fontSize: FONT.sizes.label, fontWeight: FONT.weights.medium },

    // ── Input bar ──
    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end',
      paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    micBtn: {
      width: 40, height: 40, borderRadius: 20,
      borderWidth: 1, justifyContent: 'center', alignItems: 'center',
      marginRight: SPACING.sm, marginBottom: 2,
    },
    micBtnActive: { borderColor: c.danger, backgroundColor: c.dangerLight },

    textInput: {
      flex: 1, borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
      fontSize: FONT.sizes.body, maxHeight: 100,
      borderWidth: 1,
    },

    sendBtn: {
      width: 40, height: 40, borderRadius: 20,
      justifyContent: 'center', alignItems: 'center',
      marginLeft: SPACING.sm, marginBottom: 2,
    },
  });
