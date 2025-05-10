import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'

type ItemProps = {
    item: { id: number, item: string, completed: boolean, date: string };
    onToggleTodo: (id: number) => void;
    onDeleteTodo: (id: number) => void;
}

const Item = ({ item, onToggleTodo, onDeleteTodo }: ItemProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.itemRow}>
                <Text 
                    style={[
                        styles.itemText, 
                        item.completed && styles.completedItemText
                    ]} 
                    numberOfLines={2}
                >
                    {item.item}
                </Text>
                <View style={styles.actionButtons}>
                    <Switch
                        onValueChange={() => onToggleTodo(item.id)}
                        value={item.completed}
                    />
                    <TouchableOpacity onPress={() => onDeleteTodo(item.id)}>
                        <Ionicons name="trash" size={24} color="red" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.dateText}>
                {item.date}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "column", 
        justifyContent: "space-between", 
        alignItems: "stretch", 
        padding: 10, 
        borderBottomWidth: 1, 
        borderBottomColor: "#ccc" 
    },
    itemRow: {
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center", 
    },
    itemText: {
        flex: 1, 
        marginRight: 10, 
        fontSize: 18 
    },
    completedItemText: {
        textDecorationLine: "line-through", 
        color: "gray"
    },
    actionButtons: {
        flexDirection: "row", 
        alignItems: "center"
    },
    dateText: {
        color: "gray", 
        fontSize: 14, 
        alignSelf: "flex-start" 
    }
});

export default Item;