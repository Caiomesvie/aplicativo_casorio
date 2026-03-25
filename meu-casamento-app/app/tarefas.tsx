// Arquivo: app/tarefas.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

const cores = {
  verde: '#A8D5BA',
  verdeEscuro: '#74A688',
  fundo: '#FAFAFA',
  branco: '#FFFFFF',
  textoEscuro: '#2D3142',
  cinza: '#EAEAEA',
  vermelho: '#FF9B9B'
};

type Tarefa = {
  id: string;
  titulo: string;
  concluida: boolean;
}

export default function TarefasScreen() {
  const router = useRouter();
  const [novaTarefa, setNovaTarefa] = useState('');
  const [listaTarefas, setListaTarefas] = useState<Tarefa[]>([]);

  // 1. LER TAREFAS EM TEMPO REAL
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tarefas'), (snapshot) => {
      const dados = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Tarefa[];

      // Ordenar: as não concluídas aparecem primeiro
      dados.sort((a, b) => Number(a.concluida) - Number(b.concluida));

      setListaTarefas(dados);
    });
    return () => unsub();
  }, []);

  // 2. ADICIONAR TAREFA
  const adicionarTarefa = async () => {
    if (novaTarefa.trim() === '') return;
    try {
      await addDoc(collection(db, 'tarefas'), {
        titulo: novaTarefa,
        concluida: false
      });
      setNovaTarefa('');
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a tarefa.");
    }
  };

  // 3. MARCAR/DESMARCAR COMO CONCLUÍDA
  const alternarTarefa = async (item: Tarefa) => {
    const ref = doc(db, 'tarefas', item.id);
    await updateDoc(ref, { concluida: !item.concluida });
  };

  // 4. EXCLUIR TAREFA
  const excluirTarefa = async (id: string) => {
    await deleteDoc(doc(db, 'tarefas', id));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.btnVoltar}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Checklist do Casório ✅</Text>
      </View>

      {/* Input de Nova Tarefa */}
      <View style={styles.containerInput}>
        <TextInput
          style={styles.input}
          placeholder="O que falta fazer?"
          value={novaTarefa}
          onChangeText={setNovaTarefa}
        />
        <TouchableOpacity style={styles.btnAdicionar} onPress={adicionarTarefa}>
          <Text style={styles.btnAdicionarTxt}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Tarefas */}
      <FlatList
        data={listaTarefas}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
        renderItem={({ item }) => (
          <View style={styles.cardTarefa}>
            <TouchableOpacity
              style={styles.checkArea}
              onPress={() => alternarTarefa(item)}
            >
              <View style={[styles.checkbox, item.concluida && styles.checkboxChecked]}>
                {item.concluida && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={[
                styles.textoTarefa,
                item.concluida && styles.textoConcluido
              ]}>
                {item.titulo}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => excluirTarefa(item.id)}>
              <Text style={styles.btnExcluir}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  btnVoltar: { color: cores.verdeEscuro, fontWeight: 'bold', marginRight: 15 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: cores.textoEscuro },

  containerInput: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: cores.branco,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    fontSize: 16
  },
  btnAdicionar: {
    backgroundColor: cores.verde,
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 2
  },
  btnAdicionarTxt: { color: 'white', fontSize: 30, fontWeight: 'bold' },

  cardTarefa: {
    backgroundColor: cores.branco,
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    elevation: 1
  },
  checkArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: cores.verde,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: { backgroundColor: cores.verde },
  checkMark: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  textoTarefa: { fontSize: 16, color: cores.textoEscuro },
  textoConcluido: {
    textDecorationLine: 'line-through',
    color: '#AAA',
    fontStyle: 'italic'
  },
  btnExcluir: { fontSize: 18, opacity: 0.5 }
});