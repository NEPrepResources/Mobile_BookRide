import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { CalendarX, Clock, MapPin, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';

// Booking and Vehicle type definitions
interface Booking {
  id: number;
  userId: number;
  vehicleId: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime: string;
  duration: number;
  totalPrice: number;
  vehicle?: Vehicle;
}

interface Vehicle {
  id: number;
  type: string;
  plate: string;
  driver: string;
  image: string;
}

export default function BookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      // Get all bookings for the current user
      const bookingsResponse = await axios.get(`${API_URL}/bookings?userId=${user.id}`);
      const userBookings = bookingsResponse.data;
      
      // For each booking, get the associated vehicle details
      const bookingsWithVehicles = await Promise.all(
        userBookings.map(async (booking: Booking) => {
          const vehicleResponse = await axios.get(`${API_URL}/vehicles/${booking.vehicleId}`);
          return { ...booking, vehicle: vehicleResponse.data };
        })
      );
      
      setBookings(bookingsWithVehicles);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await axios.patch(`${API_URL}/bookings/${booking.id}`, {
                status: 'cancelled'
              });
              fetchBookings(); // Refresh the list
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.pending;
      case 'confirmed':
        return COLORS.confirmed;
      case 'completed':
        return COLORS.completed;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.card;
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.vehicleType}>{item.vehicle?.type}</Text>
        <View 
          style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) }
          ]}
        >
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.infoRow}>
        <MapPin size={16} color={COLORS.textLight} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Pickup: </Text>
          {item.pickupLocation}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <MapPin size={16} color={COLORS.textLight} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Dropoff: </Text>
          {item.dropLocation}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Calendar size={16} color={COLORS.textLight} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Date: </Text>
          {item.pickupDate}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Clock size={16} color={COLORS.textLight} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Time: </Text>
          {item.pickupTime} ({item.duration} hour{item.duration > 1 ? 's' : ''})
        </Text>
      </View>
      
      <View style={styles.priceRow}>
        <Text style={styles.totalPrice}>Total: ${item.totalPrice}</Text>
        
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item)}
          >
            <CalendarX size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>View and manage your ride bookings</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bookingsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={40} color={COLORS.textLight} style={{ marginBottom: SIZES.md }} />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>Your bookings will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SIZES.xl * 2,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  bookingsList: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.lg,
  },
  bookingCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  vehicleType: {
    fontSize: 18,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  infoIcon: {
    marginRight: SIZES.sm,
  },
  infoText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    flex: 1,
  },
  infoLabel: {
    fontFamily: FONTS.medium,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalPrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: 6,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.sm,
  },
  cancelButtonText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
});