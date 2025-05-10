import React from 'react'
import { FlatList, View } from 'react-native'
import Item from './Item'

type ListProps = {
  todos: Array<{ id: number, item: string, completed: boolean, date: string }>;
  onToggleTodo: (id: number) => void;
  onDeleteTodo: (id: number) => void;
}

const List = ({ todos, onToggleTodo, onDeleteTodo }: ListProps) => {
    return (
        <View>
            <FlatList
                data={todos}
                renderItem={({ item }) => (
                    <Item 
                    item={item} 
                    onToggleTodo={onToggleTodo}
                    onDeleteTodo={onDeleteTodo} />
                )}
            />
        </View>
    )
}

export default List