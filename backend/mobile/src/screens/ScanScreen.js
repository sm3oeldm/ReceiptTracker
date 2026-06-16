import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

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
    if (isFocused) {
      setPhotoTaken(false);
    }
  }, [isFocused]);

  const [permission, requestPermission] = useCameraPermissions();

  const takePicture = async () => {
    if (cameraRef.current && !isScanning) {
      try {
        setIsScanning(true);
        setPhotoTaken(true);
        const photo = await cameraRef.current.takePictureAsync();
        console.log('Photo taken:', photo.uri);
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
        console.log('Image selected:', result.assets[0].uri);
        navigation.navigate('ReceiptConfirm', { photoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Still determining permission status
  if (!permission) {
    return <View style={[s.container, { backgroundColor: colors.bg }]} />;
  }

  // Permission not granted yet — show request screen
  if (!permission.granted) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg }]}>
        <View style={s.permissionPrompt}>
          <Ionicons name="camera" size={64} color={colors.textSecondary} />
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
        <CameraView
          style={s.camera}
          facing={facing}
          ref={cameraRef}
        />
      )}

      {/* Overlay UI rendered on top of CameraView, not inside it */}
      <View style={s.overlay} pointerEvents="box-none">
        <View style={s.cameraHeader}>
          <Text style={s.cameraTitle}>Scan Receipt</Text>
          <TouchableOpacity
            style={s.flipButton}
            onPress={toggleFacing}
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
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
            <Ionicons name="images" size={28} color="white" />
            <Text style={s.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.captureButton}
            onPress={takePicture}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <View style={s.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={s.placeholderButton} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
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
  permissionPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: c.bg,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: c.text,
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  cameraTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 20,
  },
  cameraFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: c.accent,
  },
  cornerTopRight: {
    position: 'absolute',
    top: '30%',
    right: '10%',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: c.accent,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: '35%',
    left: '10%',
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: c.accent,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: '35%',
    right: '10%',
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: c.accent,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
    paddingBottom: 50,
  },
  galleryButton: {
    alignItems: 'center',
  },
  galleryText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: c.border,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: c.accent,
  },
  placeholderButton: {
    width: 70,
    height: 70,
  },
  button: {
    backgroundColor: c.accent,
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  galleryLink: {
    marginTop: 10,
  },
  galleryLinkText: {
    color: c.accent,
    fontSize: 16,
  },
});
