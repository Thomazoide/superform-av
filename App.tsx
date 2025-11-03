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
import { CREATE_SUPERFORM_ENDPOINT } from './constants/endpoints';
import { SuperForm } from './models/superForm';
import { ResponsePayload } from './models/responses';

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
        allowsEditing: false,
        quality: 0.7,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        // Prefetch ubicación para que el envío quede listo
        getCurrentLocation();
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

    const trimmedDescription = description.trim();
    const fileName = imageUri.split('/').pop() ?? `foto-${Date.now()}.jpg`;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

    const superFormPayload: SuperForm = {
      foto: imageUri,
      description: trimmedDescription || undefined,
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
    };

    const body = new FormData();
    body.append('foto', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);
    body.append('lat', String(superFormPayload.lat));
    body.append('lng', String(superFormPayload.lng));

    if (trimmedDescription) {
      body.append('description', trimmedDescription);
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(CREATE_SUPERFORM_ENDPOINT, {
        method: 'POST',
        body,
      });

      const jsonResponse = (await response.json().catch(() => null)) as ResponsePayload<SuperForm> | null;

      if (!response.ok) {
        const backendMessage = jsonResponse?.message ?? 'Ocurrió un error al enviar el formulario.';
        throw new Error(backendMessage);
      }

      Alert.alert(
        'Formulario enviado',
        `Foto: ${imageUri ? 'Incluida' : 'No incluida'}
Descripción: ${trimmedDescription || 'Sin descripción'}
Latitud: ${superFormPayload.lat}
Longitud: ${superFormPayload.lng}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar formulario después del envío exitoso
              setImageUri(null);
              setDescription('');
              setLocation(null);
            },
          },
        ]
      );

      console.log('Datos enviados:', superFormPayload);
      if (jsonResponse) {
        console.log('Respuesta backend:', jsonResponse);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar el formulario.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
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
          style={[
            styles.submitButton,
            (!imageUri || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={submitForm}
          disabled={!imageUri || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Enviando...' : 'Enviar Formulario'}
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
