import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { Car, Search, Filter } from 'lucide-react-native';

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

export default function HomeScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (vehicles.length > 0) {
      applyFilters();
    }
  }, [searchQuery, showOnlyAvailable, vehicles]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API_URL}/vehicles`);
      setVehicles(response.data);
      setFilteredVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const applyFilters = () => {
    let results = [...vehicles];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        vehicle => 
          vehicle.type.toLowerCase().includes(query) ||
          vehicle.driver.toLowerCase().includes(query) ||
          vehicle.description.toLowerCase().includes(query)
      );
    }
    
    // Apply availability filter
    if (showOnlyAvailable) {
      results = results.filter(vehicle => vehicle.status === 'available');
    }
    
    setFilteredVehicles(results);
  };

  const toggleAvailabilityFilter = () => {
    setShowOnlyAvailable(!showOnlyAvailable);
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity 
      style={styles.vehicleCard}
      onPress={() => router.push(`/vehicle/${item.id}`)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.vehicleImage} 
        resizeMode="cover"
      />
      
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleType}>{item.type}</Text>
          <View 
            style={[
              styles.statusBadge, 
              { backgroundColor: item.status === 'available' ? COLORS.available : COLORS.unavailable }
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === 'available' ? 'Available' : 'In Use'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.vehiclePlate}>{item.plate}</Text>
        <Text style={styles.driverName}>Driver: {item.driver}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${item.pricePerHour}</Text>
          <Text style={styles.priceUnit}>/hour</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Hello, {user?.name}</Text>
          <Text style={styles.subtitle}>Find and book your perfect ride</Text>
        </View>
        <Car size={30} color={COLORS.primary} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by type, driver, or features"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            showOnlyAvailable && styles.filterButtonActive
          ]}
          onPress={toggleAvailabilityFilter}
        >
          <Filter size={20} color={showOnlyAvailable ? '#fff' : COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVehicleItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.vehicleList}
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
            <Text style={styles.emptyText}>No vehicles found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    marginRight: SIZES.sm,
    ...SHADOWS.small,
  },
  searchIcon: {
    marginRight: SIZES.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.sm,
    ...SHADOWS.small,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  vehicleList: {
    padding: SIZES.lg,
  },
  vehicleCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.md,
    marginBottom: SIZES.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  vehicleImage: {
    width: '100%',
    height: 180,
  },
  vehicleInfo: {
    padding: SIZES.md,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
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
  vehiclePlate: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  driverName: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginBottom: SIZES.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginLeft: 2,
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
    paddingVertical: SIZES.xl,
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
    textAlign: 'center',
  },
});