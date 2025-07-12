import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ChevronDown, Check } from 'lucide-react-native';

const { height } = Dimensions.get('window');

interface AgeSelectorProps {
  selectedAge?: number;
  onAgeSelected: (age: number) => void;
}

export default function AgeSelector({ selectedAge, onAgeSelected }: AgeSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempAge, setTempAge] = useState(selectedAge || 25);

  const ages = Array.from({ length: 83 }, (_, i) => i + 18); // 18 to 100

  const handleConfirm = () => {
    onAgeSelected(tempAge);
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, selectedAge && styles.selectedSelector]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.selectorText, selectedAge && styles.selectedSelectorText]}>
          {selectedAge ? `${selectedAge} years old` : 'Select your age'}
        </Text>
        <ChevronDown size={24} color={selectedAge ? '#3B82F6' : '#9CA3AF'} />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Age</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Check size={24} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempAge}
                onValueChange={(value) => setTempAge(value)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {ages.map((age) => (
                  <Picker.Item
                    key={age}
                    label={`${age} years old`}
                    value={age}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedSelector: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  selectorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  selectedSelectorText: {
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  pickerContainer: {
    paddingHorizontal: 24,
  },
  picker: {
    height: 200,
  },
  pickerItem: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
});