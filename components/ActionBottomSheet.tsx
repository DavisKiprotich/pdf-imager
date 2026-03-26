import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  withTiming
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ActionBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  fileName: string;
  onOpen: () => void;
  onShare: () => void;
  onDelete?: () => void;
  t: any;
}

export default function ActionBottomSheet({ isVisible, onClose, fileName, onOpen, onShare, onDelete, t }: ActionBottomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleClose = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose]);

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      
      <Animated.View style={[styles.sheet, animatedStyle]}>
        <View style={styles.handle} />
        
        <View style={styles.header}>
            <View style={styles.fileIcon}>
                <Ionicons 
                    name={fileName.toLowerCase().endsWith('.pdf') ? "document-text" : "document"} 
                    size={28} 
                    color={fileName.toLowerCase().endsWith('.pdf') ? "#EF4444" : "#2563EB"} 
                />
            </View>
            <View style={styles.headerText}>
                <Text numberOfLines={1} style={styles.title}>{fileName}</Text>
                <Text style={styles.subtitle}>{fileName.toUpperCase().split('.').pop()} Document</Text>
            </View>
        </View>

        <View style={styles.options}>
          <Pressable 
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]} 
            onPress={() => { onOpen(); handleClose(); }}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="eye-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.optionText}>{t.openFile || "Open File"}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]} 
            onPress={() => { onShare(); handleClose(); }}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="share-outline" size={24} color="#16A34A" />
            </View>
            <Text style={styles.optionText}>{t.share || "Share"}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </Pressable>

          {onDelete && (
            <Pressable 
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]} 
                onPress={() => { onDelete(); handleClose(); }}
            >
                <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
                </View>
                <Text style={[styles.optionText, { color: '#EF4444' }]}>{t.deletePermanently || "Delete"}</Text>
                <Ionicons name="chevron-forward" size={18} color="#FCE7F3" />
            </Pressable>
          )}
        </View>

        <Pressable 
            style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]} 
            onPress={handleClose}
        >
          <Text style={styles.cancelText}>{t.cancel || "Cancel"}</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
  },
  fileIcon: {
    width: 54,
    height: 54,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  options: {
    gap: 12,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 18,
  },
  optionPressed: {
      backgroundColor: '#E2E8F0',
      transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: '#0F172A',
  },
  cancelButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
  },
  cancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
