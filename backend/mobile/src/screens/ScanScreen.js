import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';

export default function ScanScreen() {
  const [facing, setFacing] = useState('back');
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const [permission, requestPermission] = useCameraPermissions();

  const takePicture = async () => {
    if (cameraRef.current && !isScanning) {
      try {
        setIsScanning(true);
        let photo = await cameraRef.current.takePictureAsync();
        console.log('Photo taken:', photo.uri);
        setCapturedPhoto(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture receipt');
      } finally {
        setIsScanning(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      setIsScanning(true);
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        console.log('Image selected:', result.assets[0].uri);
        setCapturedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select receipt');
    } finally {
      setIsScanning(false);
    }
  };

  const resetCapture = () => {
    setCapturedPhoto(null);
  };

  const usePhoto = async () => {
    if (!capturedPhoto) return;
    Alert.alert(
      'Receipt Captured',
      'Photo saved. OCR processing will be available in the next update.',
      [{ text: 'OK', onPress: resetCapture }]
    );
  };

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Show photo preview after capture
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={styles.preview} />
        <View style={styles.previewOverlay}>
          <Text style={styles.previewTitle}>Receipt Captured</Text>
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.actionButton} onPress={resetCapture}>
            <Ionicons name="close" size={24} color="white" />
            <Text style={styles.actionText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.useButton]}
            onPress={usePhoto}
          >
            <Ionicons name="checkmark" size={24} color="white" />
            <Text style={styles.actionText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Still determining permission status
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission not granted yet — show request screen
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionPrompt}>
          <Ionicons name="camera" size={64} color="#666" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            Allow camera access to scan receipts. Your photos won't be shared without your permission.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryLink} onPress={pickImage}>
            <Text style={styles.galleryLinkText}>Or pick from gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
      />

      {/* Overlay UI rendered on top of CameraView, not inside it */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.cameraHeader}>
          <Text style={styles.cameraTitle}>Scan Receipt</Text>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleFacing}
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.cameraFrame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage} disabled={isScanning}>
            <Ionicons name="images" size={28} color="white" />
            <Text style={styles.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 30,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  useButton: {
    backgroundColor: '#4CAF50',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  permissionPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
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
    borderColor: '#4CAF50',
  },
  cornerTopRight: {
    position: 'absolute',
    top: '30%',
    right: '10%',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4CAF50',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: '35%',
    left: '10%',
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4CAF50',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: '35%',
    right: '10%',
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4CAF50',
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
    borderColor: '#ccc',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
  },
  placeholderButton: {
    width: 70,
    height: 70,
  },
  button: {
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
    fontSize: 16,
  },
});
