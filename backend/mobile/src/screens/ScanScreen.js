import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT } from '../constants/design';

export default function ScanScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [facing, setFacing] = useState('back');
  const [isScanning, setIsScanning] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const cameraRef = useRef(null);
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (isFocused) setPhotoTaken(false);
  }, [isFocused]);

  const [permission, requestPermission] = useCameraPermissions();

  const takePicture = async () => {
    if (cameraRef.current && !isScanning) {
      try {
        setIsScanning(true);
        setPhotoTaken(true);
        const photo = await cameraRef.current.takePictureAsync();
        navigation.navigate('ReceiptConfirm', { photoUri: photo.uri });
      } catch (error) {
        console.error('Error taking picture:', error);
        setPhotoTaken(false);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      setIsScanning(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setPhotoTaken(true);
        navigation.navigate('ReceiptConfirm', { photoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return <View style={[s.container, { backgroundColor: colors.bg }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg }]}>
        <View style={s.permissionPrompt}>
          <View style={s.permissionIconWrap}>
            <Ionicons name="camera-outline" size={40} color={colors.textSecondary} />
          </View>
          <Text style={s.permissionTitle}>Camera Access Needed</Text>
          <Text style={s.permissionText}>
            Allow camera access to scan receipts. Your photos won't be shared without your permission.
          </Text>
          <TouchableOpacity style={s.button} onPress={requestPermission}>
            <Text style={s.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.galleryLink} onPress={pickImage}>
            <Text style={s.galleryLinkText}>Or pick from gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {photoTaken ? (
        <View style={s.cameraCover} />
      ) : (
        <CameraView style={s.camera} facing={facing} ref={cameraRef} />
      )}

      <View style={s.overlay} pointerEvents="box-none">
        <View style={s.cameraHeader}>
          <Text style={s.cameraTitle}>Scan Receipt</Text>
          <TouchableOpacity style={s.flipButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={s.cameraFrame}>
          <View style={s.cornerTopLeft} />
          <View style={s.cornerTopRight} />
          <View style={s.cornerBottomLeft} />
          <View style={s.cornerBottomRight} />
        </View>

        <View style={s.cameraControls}>
          <TouchableOpacity style={s.galleryButton} onPress={pickImage} disabled={isScanning}>
            <Ionicons name="images-outline" size={26} color="#FFFFFF" />
            <Text style={s.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.captureButton}
            onPress={takePicture}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <View style={s.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={{ width: 70 }} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    camera: {
      ...StyleSheet.absoluteFillObject,
    },
    cameraCover: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },

    // ── Permission prompt ──
    permissionPrompt: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xxxl,
    },
    permissionIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    permissionTitle: {
      fontSize: FONT.sizes.title,
      fontWeight: FONT.weights.bold,
      color: c.text,
      marginBottom: SPACING.sm,
    },
    permissionText: {
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.xxl,
      lineHeight: 22,
    },

    // ── Camera UI ──
    cameraHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.xl,
      paddingTop: Platform.OS === 'ios' ? 64 : 48,
    },
    cameraTitle: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.heading,
      fontWeight: FONT.weights.semibold,
    },
    flipButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraFrame: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cornerTopLeft: {
      position: 'absolute',
      top: '28%',
      left: '10%',
      width: 28,
      height: 28,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderColor: c.accent,
      borderTopLeftRadius: 4,
    },
    cornerTopRight: {
      position: 'absolute',
      top: '28%',
      right: '10%',
      width: 28,
      height: 28,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderColor: c.accent,
      borderTopRightRadius: 4,
    },
    cornerBottomLeft: {
      position: 'absolute',
      bottom: '35%',
      left: '10%',
      width: 28,
      height: 28,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderColor: c.accent,
      borderBottomLeftRadius: 4,
    },
    cornerBottomRight: {
      position: 'absolute',
      bottom: '35%',
      right: '10%',
      width: 28,
      height: 28,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderColor: c.accent,
      borderBottomRightRadius: 4,
    },
    cameraControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.xl,
      paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    },
    galleryButton: {
      alignItems: 'center',
      gap: 4,
    },
    galleryText: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.label,
      fontWeight: FONT.weights.medium,
    },
    captureButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.5)',
    },
    captureButtonInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FFFFFF',
    },

    // ── Permission UI buttons ──
    button: {
      backgroundColor: c.accent,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xxxl,
      borderRadius: RADIUS.md,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
    },
    galleryLink: {
      marginTop: SPACING.lg,
      padding: SPACING.sm,
    },
    galleryLinkText: {
      color: c.accent,
      fontSize: FONT.sizes.body,
      fontWeight: FONT.weights.medium,
    },
  });
