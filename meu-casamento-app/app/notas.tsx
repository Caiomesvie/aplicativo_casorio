// Arquivo: app/notas.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, StatusBar, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';

// NOVA PALETA: AZUL CLARINHO 🩵
const cores = {
  azulClaro: '#A2D2FF',     // Cor principal dos botões e do "+"
  azulEscuro: '#5C8A9E',    // Cor para textos de destaque e botão voltar
  fundo: '#FAFAFA',
  branco: '#FFFFFF',
  textoEscuro: '#2D3142',
  cinza: '#EAEAEA',
  fundoPostit: '#EBF5FF'    // Um azul beeeem clarinho para os cards não cansarem a vista
};

type Nota = {
  id: string;
  titulo: string;
  conteudo: string;
  dataCriacao: number;
}

export default function NotasScreen() {
  const router = useRouter();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);

  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'notas'), orderBy('dataCriacao', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotas(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Nota[]);
    });
    return () => unsub();
  }, []);

  const salvarNota = async () => {
    if (!titulo || !conteudo) return Alert.alert("Erro", "Preencha o título e o conteúdo!");
    try {
      if (idEdicao) {
        await updateDoc(doc(db, 'notas', idEdicao), { titulo, conteudo });
      } else {
        await addDoc(collection(db, 'notas'), { titulo, conteudo, dataCriacao: new Date().getTime() });
      }
      fecharModal();
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar a nota.");
    }
  };

  const abrirModalParaEdicao = (nota: Nota) => {
    setIdEdicao(nota.id); setTitulo(nota.titulo); setConteudo(nota.conteudo); setModalVisivel(true);
  };

  const fecharModal = () => {
    setIdEdicao(null); setTitulo(''); setConteudo(''); setModalVisivel(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.btnVoltar}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Bloco de Notas 📝</Text>
      </View>

      <FlatList
        data={notas}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhuma anotação ainda. Comece a planejar!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardNota} onPress={() => abrirModalParaEdicao(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tituloNota}>{item.titulo}</Text>
              <Text style={styles.conteudoNota} numberOfLines={3}>{item.conteudo}</Text>
            </View>
            <TouchableOpacity style={styles.btnLixeira} onPress={() => Alert.alert("Excluir", "Apagar nota?", [{ text: "Não" }, { text: "Sim", onPress: () => deleteDoc(doc(db, 'notas', item.id)) }])}>
              <Text style={{ fontSize: 20 }}>🗑️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisivel(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>{idEdicao ? "Editar Anotação" : "Nova Anotação"}</Text>

            <TextInput style={styles.inputTitulo} placeholder="Ex: Ideias para os votos" value={titulo} onChangeText={setTitulo} />
            <TextInput style={styles.inputConteudo} placeholder="Escreva os detalhes aqui..." value={conteudo} onChangeText={setConteudo} multiline textAlignVertical="top" />

            <TouchableOpacity style={styles.btnSalvar} onPress={salvarNota}>
              <Text style={styles.btnSalvarText}>Salvar Nota</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={fecharModal}>
              <Text style={styles.btnFechar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  btnVoltar: { color: cores.azulEscuro, fontWeight: 'bold', marginRight: 15 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: cores.textoEscuro },
  cardNota: { backgroundColor: cores.fundoPostit, padding: 20, borderRadius: 18, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15, elevation: 3 },
  tituloNota: { fontSize: 18, fontWeight: 'bold', color: cores.textoEscuro, marginBottom: 8 },
  conteudoNota: { fontSize: 14, color: '#555', lineHeight: 20 },
  btnLixeira: { padding: 5, marginLeft: 15, opacity: 0.6 },
  vazio: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: cores.azulClaro, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: cores.branco, fontSize: 30, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: cores.branco, padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '90%' },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: cores.textoEscuro },
  inputTitulo: { backgroundColor: cores.fundo, padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: cores.cinza, fontSize: 16, fontWeight: 'bold' },
  inputConteudo: { backgroundColor: cores.fundo, padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: cores.cinza, fontSize: 16, height: 150 },
  btnSalvar: { backgroundColor: cores.azulClaro, padding: 18, borderRadius: 12, alignItems: 'center' },
  btnSalvarText: { color: cores.textoEscuro, fontWeight: 'bold', fontSize: 16 }, // Texto escuro para dar contraste com o azul claro
  btnFechar: { textAlign: 'center', marginTop: 15, color: '#999', fontWeight: 'bold' }
});