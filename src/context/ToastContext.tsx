import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { storage } from '../utils/storage';

type ToastType = 'error' | 'sessionExpired' | 'success' | 'info';

interface ToastConfig {
    type: ToastType;
    message: string;
    duration?: number;
    onDismiss?: () => void;
}

interface ToastContextType {
    showToast: (config: ToastConfig) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Singleton for accessing toast from outside React components (like axios interceptors)
let toastRef: ToastContextType | null = null;

export const showGlobalToast = (config: ToastConfig) => {
    if (toastRef) {
        toastRef.showToast(config);
    }
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<ToastConfig | null>(null);
    const slideAnim = useRef(new Animated.Value(-200)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hideToast = useCallback(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -200,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            if (config?.onDismiss) {
                config.onDismiss();
            }
            setConfig(null);
        });
    }, [slideAnim, opacityAnim, config]);

    const showToast = useCallback((newConfig: ToastConfig) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setConfig(newConfig);
        setVisible(true);

        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        const duration = newConfig.duration ?? (newConfig.type === 'sessionExpired' ? 2500 : 4000);
        timeoutRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, [slideAnim, opacityAnim, hideToast]);

    // Set the singleton reference
    useEffect(() => {
        toastRef = { showToast, hideToast };
        return () => {
            toastRef = null;
        };
    }, [showToast, hideToast]);

    const getToastStyle = () => {
        switch (config?.type) {
            case 'sessionExpired':
                return {
                    backgroundColor: 'rgba(239, 68, 68, 0.95)',
                    iconName: 'lock-clock' as const,
                    iconColor: '#FEE2E2',
                };
            case 'error':
                return {
                    backgroundColor: 'rgba(245, 158, 11, 0.95)',
                    iconName: 'alert-circle' as const,
                    iconColor: '#FEF3C7',
                };
            case 'success':
                return {
                    backgroundColor: 'rgba(16, 185, 129, 0.95)',
                    iconName: 'check-circle' as const,
                    iconColor: '#D1FAE5',
                };
            default:
                return {
                    backgroundColor: 'rgba(59, 130, 246, 0.95)',
                    iconName: 'information' as const,
                    iconColor: '#DBEAFE',
                };
        }
    };

    const toastStyle = getToastStyle();

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {visible && config && (
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{ translateY: slideAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    <View style={[styles.toast, { backgroundColor: toastStyle.backgroundColor }]}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                                name={toastStyle.iconName}
                                size={28}
                                color={toastStyle.iconColor}
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>
                                {config.type === 'sessionExpired' ? 'Session Ended' : 'Oops!'}
                            </Text>
                            <Text style={styles.message}>{config.message}</Text>
                        </View>
                        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Helper function for session expired - handles redirect
export const handleSessionExpired = async () => {
    try {
        await storage.clearAll();
    } catch (error) {
        console.error('Error clearing storage:', error);
    }

    showGlobalToast({
        type: 'sessionExpired',
        message: 'Your session has ended. Please log in again.',
        duration: 2000,
        onDismiss: () => {
            setTimeout(() => {
                router.replace('/login');
            }, 100);
        },
    });
};

// Helper function for general API errors
export const handleApiError = () => {
    showGlobalToast({
        type: 'error',
        message: 'There is a problem, we are temporarily fixing it. Please try again in a moment.',
        duration: 4000,
    });
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
        elevation: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
    },
    closeButton: {
        padding: 8,
        marginLeft: 8,
    },
});

export default ToastContext;
