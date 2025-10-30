import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // Permisos de cámara
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    // Permisos de ubicación
    const locationPermission = await Location.requestForegroundPermissionsAsync();

    if (cameraPermission.status !== 'granted' || 
        mediaLibraryPermission.status !== 'granted' ||
        locationPermission.status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Esta aplicación necesita permisos de cámara y ubicación para funcionar correctamente.'
      );
    }
  };

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
      return null;
    }
  };

  const submitForm = async () => {
    // Validar que hay una foto (obligatorio)
    if (!imageUri) {
      Alert.alert('Error', 'Debes tomar una foto antes de enviar el formulario');
      return;
    }

    // Obtener ubicación actual
    const currentLocation = await getCurrentLocation();
    
    if (!currentLocation) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
      return;
    }

    // Aquí puedes guardar los datos donde necesites
    const formData = {
      image: imageUri,
      description: description.trim(),
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      timestamp: new Date().toISOString(),
    };

    // Mostrar datos del formulario (para prueba)
    Alert.alert(
      'Formulario enviado',
      `Foto: ${imageUri ? 'Incluida' : 'No incluida'}
Descripción: ${description || 'Sin descripción'}
Latitud: ${currentLocation.coords.latitude}
Longitud: ${currentLocation.coords.longitude}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Limpiar formulario
            setImageUri(null);
            setDescription('');
            setLocation(null);
          }
        }
      ]
    );

    console.log('Datos del formulario:', formData);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Súper formulario</Text>
        
        {/* Sección de foto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto (Obligatorio)</Text>
          
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity style={styles.retakeButton} onPress={takePicture}>
                <Text style={styles.buttonText}>Tomar nueva foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
              <Text style={styles.buttonText}>📷 Tomar Foto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sección de descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción (Opcional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe una descripción..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={300}
          />
          <Text style={styles.charCounter}>{description.length}/300</Text>
        </View>

        {/* Botón de envío */}
        <TouchableOpacity 
          style={[styles.submitButton, !imageUri && styles.submitButtonDisabled]} 
          onPress={submitForm}
          disabled={!imageUri}
        >
          <Text style={styles.submitButtonText}>Enviar Formulario</Text>
        </TouchableOpacity>

        {/* Información de ubicación */}
        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              📍 Ubicación actual: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#FF9500',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: Dimensions.get('window').width - 80,
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCounter: {
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
});
