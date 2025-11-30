import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../constants/colors';

const NavItem = ({ icon, label, active, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.navItem, active && styles.navItemActive]}
      activeOpacity={0.7}
    >
      <Icon
        name={icon}
        size={24}
        color={active ? COLORS.purple600 : COLORS.gray400}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const BottomNavigation = () => {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View style={styles.container}>
      <NavItem
        icon="home"
        label="Beranda"
        active={route.name === 'Home'}
        onPress={() => navigation.navigate('Home')}
      />
      <NavItem
        icon="book"
        label="Materi"
        active={route.name === 'Courses'}
        onPress={() => navigation.navigate('Courses')}
      />
      <NavItem
        icon="checkmark-circle"
        label="Presensi"
        active={route.name === 'RiwayatPresensi'}
        onPress={() => navigation.navigate('RiwayatPresensi')}
      />
      <NavItem
        icon="person"
        label="Profil"
        active={route.name === 'Profile'}
        onPress={() => navigation.navigate('Profile')}
      />
    </View>
  );
};

export default BottomNavigation;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: COLORS.purple50,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray400,
    marginTop: 4,
  },
  navLabelActive: {
    color: COLORS.purple600,
  },
});