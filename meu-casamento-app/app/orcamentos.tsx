// Arquivo: app/orcamentos.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, StatusBar, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

const coresBase = {
  azulEscuro: '#219EBC',
  amarelo: '#FFB703',
  fundo: '#FAFAFA',
  branco: '#FFFFFF',
  texto: '#2D3142',
  cinza: '#EAEAEA',
  vencedor: '#FFF9E6',
};

// Ordem da paleta que definirá a ordenação na tela
const PALETA_CORES = [
  '#A8E6CF', '#FFD3B6', '#D1C4E9', '#FFAAA5',
  '#ADEFD1', '#AEC6CF', '#8ECAE6', '#FFB703', '#E63946'
];

type Orcamento = {
  id: string;
  fornecedor: string;
  categoria: string;
  valor: number;
  estrelas: number;
  selecionado: boolean;
  notas: string;
  cor: string;
}

export default function OrcamentosScreen() {
  const router = useRouter();
  const [modalVisivel, setModalVisivel] = useState(false);
  const [idSendoEditado, setIdSendoEditado] = useState<string | null>(null);

  const [fornecedor, setFornecedor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [notas, setNotas] = useState('');
  const [corSelecionada, setCorSelecionada] = useState(PALETA_CORES[0]);

  const [lista, setLista] = useState<Orcamento[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orcamentos'), (snap) => {
      const dados = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Orcamento[];

      // --- LÓGICA DE ORDENAÇÃO POR COR ---
      dados.sort((a, b) => {
        const indexA = PALETA_CORES.indexOf(a.cor);
        const indexB = PALETA_CORES.indexOf(b.cor);
        // Se a cor não estiver na paleta (erro ou antiga), joga pro final
        const posA = indexA === -1 ? 999 : indexA;
        const posB = indexB === -1 ? 999 : indexB;
        return posA - posB;
      });

      setLista(dados);
    });
    return () => unsub();
  }, []);

  const salvarOrcamento = async () => {
    if (!fornecedor || !valor) return Alert.alert("Erro", "Preencha o nome e o valor!");
    const dados = { fornecedor, categoria: categoria || 'Geral', valor: parseFloat(valor.toString().replace(',', '.')), notas: notas || '', cor: corSelecionada };
    try {
      if (idSendoEditado) { await updateDoc(doc(db, 'orcamentos', idSendoEditado), dados); }
      else { await addDoc(collection(db, 'orcamentos'), { ...dados, estrelas: 3, selecionado: false }); }
      fecharModal();
    } catch (e) { Alert.alert("Erro", "Falha ao salvar."); }
  };

  const abrirParaEditar = (item: Orcamento) => {
    setIdSendoEditado(item.id); setFornecedor(item.fornecedor); setCategoria(item.categoria); setValor(item.valor.toString()); setNotas(item.notas); setCorSelecionada(item.cor || PALETA_CORES[0]); setModalVisivel(true);
  };

  const fecharModal = () => { setModalVisivel(false); setIdSendoEditado(null); setFornecedor(''); setCategoria(''); setValor(''); setNotas(''); setCorSelecionada(PALETA_CORES[0]); };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.btnVoltar}>{"< Voltar"}</Text></TouchableOpacity>
        <Text style={styles.titulo}>Orçamentos 📊</Text>
      </View>

      <FlatList
        data={lista}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={[styles.card, item.selecionado && styles.cardSelecionado, { borderLeftColor: item.cor || coresBase.azulEscuro }]}>
            <TouchableOpacity onPress={() => abrirParaEditar(item)}>
              <View style={styles.headerCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txtCategoria}>{item.categoria.toUpperCase()}</Text>
                  <Text style={styles.txtFornecedor}>{item.fornecedor}</Text>
                </View>
                {item.selecionado && <Text style={styles.trofeu}>🏆</Text>}
              </View>
              <Text style={styles.txtValor}>R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              {item.notas ? <Text style={styles.txtNotasPrevia} numberOfLines={1}>📝 {item.notas}</Text> : null}
            </TouchableOpacity>

            <View style={styles.footerCard}>
              <View style={styles.estrelasRow}>
                {[1, 2, 3, 4, 5].map(num => (
                  <TouchableOpacity key={num} onPress={() => updateDoc(doc(db, 'orcamentos', item.id), { estrelas: num })}>
                    <Text style={{ fontSize: 22, color: num <= item.estrelas ? coresBase.amarelo : '#CCC' }}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={[styles.btnEscolher, item.selecionado && { backgroundColor: coresBase.amarelo }]} onPress={() => updateDoc(doc(db, 'orcamentos', item.id), { selecionado: !item.selecionado })}>
                  <Text style={styles.btnEscolherTxt}>{item.selecionado ? "Escolhido!" : "Selecionar"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => deleteDoc(doc(db, 'orcamentos', item.id))}><Text style={{ fontSize: 20 }}>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisivel(true)}><Text style={styles.fabTxt}>+</Text></TouchableOpacity>

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitulo}>{idSendoEditado ? "Editar Orçamento" : "Novo Orçamento"}</Text>
              <TextInput style={styles.input} placeholder="Fornecedor" value={fornecedor} onChangeText={setFornecedor} />
              <TextInput style={styles.input} placeholder="Categoria" value={categoria} onChangeText={setCategoria} />
              <TextInput style={styles.input} placeholder="Valor (R$)" keyboardType="numeric" value={valor} onChangeText={setValor} />
              <Text style={styles.labelCores}>Marcador Visual:</Text>
              <View style={styles.paletaContainer}>
                {PALETA_CORES.map(cor => (
                  <TouchableOpacity key={cor} style={[styles.bolaCor, { backgroundColor: cor }, corSelecionada === cor && styles.bolaSelecionada]} onPress={() => setCorSelecionada(cor)} />
                ))}
              </View>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Notas" multiline value={notas} onChangeText={setNotas} />
              <TouchableOpacity style={styles.btnSalvar} onPress={salvarOrcamento}><Text style={styles.btnSalvarTxt}>Salvar</Text></TouchableOpacity>
              <TouchableOpacity onPress={fecharModal}><Text style={styles.btnFechar}>Cancelar</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: coresBase.fundo },
  cabecalho: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  btnVoltar: { color: coresBase.azulEscuro, fontWeight: 'bold', marginRight: 15 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: coresBase.texto },
  card: { backgroundColor: coresBase.branco, padding: 20, borderRadius: 25, marginBottom: 15, elevation: 3, borderLeftWidth: 12 },
  cardSelecionado: { backgroundColor: coresBase.vencedor, borderColor: coresBase.amarelo },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  txtCategoria: { fontSize: 10, fontWeight: '800', color: '#888', letterSpacing: 1 },
  txtFornecedor: { fontSize: 18, fontWeight: 'bold', color: coresBase.texto },
  trofeu: { fontSize: 24 },
  txtValor: { fontSize: 22, fontWeight: 'bold', color: coresBase.texto, marginBottom: 5 },
  txtNotasPrevia: { fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 10 },
  footerCard: { borderTopWidth: 1, borderTopColor: coresBase.cinza, paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estrelasRow: { flexDirection: 'row' },
  btnEscolher: { backgroundColor: coresBase.azulEscuro, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  btnEscolherTxt: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: coresBase.azulEscuro, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabTxt: { color: 'white', fontSize: 35 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '90%' },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 15, marginBottom: 15, fontSize: 16 },
  labelCores: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: coresBase.texto },
  paletaContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, justifyContent: 'center' },
  bolaCor: { width: 35, height: 35, borderRadius: 18, margin: 5 },
  bolaSelecionada: { borderColor: coresBase.texto, borderWidth: 3 },
  btnSalvar: { backgroundColor: coresBase.azulEscuro, padding: 18, borderRadius: 15, alignItems: 'center' },
  btnSalvarTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnFechar: { textAlign: 'center', marginTop: 15, color: '#999', fontWeight: 'bold' }
});