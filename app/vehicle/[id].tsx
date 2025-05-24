import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Car, 
  User as UserIcon, 
  MapPin, 
  Tag, 
  Check
} from 'lucide-react-native';

// Vehicle type definition
interface Vehicle {
  id: number;
  type: string;
  plate: string;
  driver: string;
  status: 'available' | 'in use';
  image: string;
  pricePerHour: number;
  description: string;
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    pickupLocation: '',
    dropLocation: '',
    pickupDate: '',
    pickupTime: '',
    duration: '1',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/vehicles/${id}`);
      setVehicle(response.data);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      Alert.alert('Error', 'Failed to load vehicle details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = () => {
    if (vehicle?.status !== 'available') {
      Alert.alert('Not Available', 'This vehicle is currently in use.');
      return;
    }
    
    setIsBooking(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setBookingForm({
      ...bookingForm,
      [field]: value,
    });
  };

  const handleSubmitBooking = async () => {
    // Validate inputs
    if (!bookingForm.pickupLocation || !bookingForm.dropLocation || !bookingForm.pickupDate || !bookingForm.pickupTime) {
      Alert.alert('Missing Information', 'Please fill in all booking details');
      return;
    }
    
    // Basic date validation (very simple)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(bookingForm.pickupDate)) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format');
      return;
    }
    
    // Basic time validation
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (!timeRegex.test(bookingForm.pickupTime)) {
      Alert.alert('Invalid Time', 'Please use HH:MM format');
      return;
    }

    if (!user || !vehicle) return;

    setIsSubmitting(true);
    try {
      const duration = parseInt(bookingForm.duration);
      const totalPrice = duration * vehicle.pricePerHour;
      
      const response = await axios.post(`${API_URL}/bookings`, {
        userId: user.id,
        vehicleId: vehicle.id,
        status: 'pending',
        pickupLocation: bookingForm.pickupLocation,
        dropLocation: bookingForm.dropLocation,
        pickupDate: bookingForm.pickupDate,
        pickupTime: bookingForm.pickupTime,
        duration,
        totalPrice
      });
      
      if (response.data) {
        Alert.alert(
          'Booking Successful',
          'Your booking has been submitted and is pending confirmation.',
          [
            {
              text: 'View Bookings',
              onPress: () => router.push('/bookings'),
            }
          ]
        );
        setIsBooking(false);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Booking Failed', 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsBooking(false);
    // Reset form
    setBookingForm({
      pickupLocation: '',
      dropLocation: '',
      pickupDate: '',
      pickupTime: '',
      duration: '1',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Vehicle not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <Image 
          source={{ uri: vehicle.image }} 
          style={styles.vehicleImage} 
          resizeMode="cover"
        />

        <View style={styles.detailsContainer}>
          <View style={styles.topRow}>
            <Text style={styles.vehicleType}>{vehicle.type}</Text>
            <View 
              style={[
                styles.statusBadge, 
                { backgroundColor: vehicle.status === 'available' ? COLORS.available : COLORS.unavailable }
              ]}
            >
              <Text style={styles.statusText}>
                {vehicle.status === 'available' ? 'Available' : 'In Use'}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Car size={20} color={COLORS.textLight} style={styles.infoIcon} />
              <Text style={styles.infoText}>Plate Number: {vehicle.plate}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <UserIcon size={20} color={COLORS.textLight} style={styles.infoIcon} />
              <Text style={styles.infoText}>Driver: {vehicle.driver}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Tag size={20} color={COLORS.textLight} style={styles.infoIcon} />
              <Text style={styles.infoText}>Price: ${vehicle.pricePerHour}/hour</Text>
            </View>
          </View>

          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{vehicle.description}</Text>

          {isBooking ? (
            <View style={styles.bookingForm}>
              <Text style={styles.bookingTitle}>Book This Vehicle</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pickup Location</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter pickup location"
                    value={bookingForm.pickupLocation}
                    onChangeText={(value) => handleInputChange('pickupLocation', value)}
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Drop-off Location</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter drop-off location"
                    value={bookingForm.dropLocation}
                    onChangeText={(value) => handleInputChange('dropLocation', value)}
                  />
                </View>
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: SIZES.sm }]}>
                  <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                  <View style={styles.inputContainer}>
                    <Calendar size={20} color={COLORS.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      value={bookingForm.pickupDate}
                      onChangeText={(value) => handleInputChange('pickupDate', value)}
                    />
                  </View>
                </View>
                
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Time (HH:MM)</Text>
                  <View style={styles.inputContainer}>
                    <Clock size={20} color={COLORS.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="HH:MM"
                      value={bookingForm.pickupTime}
                      onChangeText={(value) => handleInputChange('pickupTime', value)}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Duration (hours)</Text>
                <View style={styles.inputContainer}>
                  <Clock size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Number of hours"
                    value={bookingForm.duration}
                    onChangeText={(value) => handleInputChange('duration', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.priceEstimate}>
                <Text style={styles.priceEstimateLabel}>Estimated Total:</Text>
                <Text style={styles.priceEstimateValue}>
                  ${vehicle.pricePerHour * parseInt(bookingForm.duration || '0')}
                </Text>
              </View>
              
              <View style={styles.formButtons}>
                <TouchableOpacity 
                  style={[styles.formButton, styles.cancelFormButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelFormButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.formButton, styles.confirmFormButton]}
                  onPress={handleSubmitBooking}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Check size={20} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.confirmFormButtonText}>Confirm Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.bookButton,
                vehicle.status !== 'available' && styles.disabledButton
              ]}
              onPress={handleBookNow}
              disabled={vehicle.status !== 'available'}
            >
              <Text style={styles.bookButtonText}>
                {vehicle.status === 'available' ? 'Book Now' : 'Not Available'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    position: 'absolute',
    top: SIZES.xl,
    left: SIZES.md,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  vehicleImage: {
    width: '100%',
    height: 250,
  },
  detailsContainer: {
    padding: SIZES.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  vehicleType: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.sm,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  infoSection: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  infoIcon: {
    marginRight: SIZES.sm,
  },
  infoText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  descriptionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SIZES.lg,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  disabledButton: {
    backgroundColor: COLORS.textLight,
  },
  bookButtonText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  errorText: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    marginBottom: SIZES.md,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginLeft: 4,
  },
  bookingForm: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  bookingTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  formGroup: {
    marginBottom: SIZES.md,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.background,
  },
  inputIcon: {
    marginHorizontal: SIZES.sm,
  },
  input: {
    flex: 1,
    height: 44,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    paddingRight: SIZES.sm,
  },
  priceEstimate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SIZES.md,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  priceEstimateLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  priceEstimateValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.md,
  },
  formButton: {
    flex: 1,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 50,
  },
  cancelFormButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SIZES.sm,
  },
  confirmFormButton: {
    backgroundColor: COLORS.primary,
  },
  cancelFormButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  confirmFormButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#fff',
  },
});