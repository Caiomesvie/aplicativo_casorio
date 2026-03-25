// Arquivo: app/pagamentos.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, StatusBar, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { collection, addDoc, deleteDoc, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../src/firebase';

const cores = {
  terracota: '#E29578',
  terracotaEscuro: '#B86B50',
  verde: '#A8D5BA',
  verdeEscuro: '#74A688',
  fundo: '#FAFAFA',
  branco: '#FFFFFF',
  textoEscuro: '#2D3142',
  cinza: '#EAEAEA'
};

type Compra = {
  id: string;
  descricao: string;
  valorTotal: number;
  valorPago: number;
  qtdParcelas: number;
}

export default function PagamentosScreen() {
  const router = useRouter();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [modalNovaCompra, setModalNovaCompra] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Form
  const [desc, setDesc] = useState('');
  const [total, setTotal] = useState('');
  const [entrada, setEntrada] = useState('');
  const [qtdP, setQtdP] = useState('1');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'compras'), (snap) => {
      setCompras(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Compra[]);
    });
    return () => unsub();
  }, []);

  // --- CÁLCULOS DO DASHBOARD ---
  const totalGeralOrcado = compras.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const totalGeralPago = compras.reduce((acc, curr) => acc + curr.valorPago, 0);
  const restanteGeral = totalGeralOrcado - totalGeralPago;
  const progressoTotal = totalGeralOrcado > 0 ? (totalGeralPago / totalGeralOrcado) : 0;

  const salvarCompra = async () => {
    if (!desc || !total || salvando) return Alert.alert("Erro", "Campos obrigatórios!");
    setSalvando(true);

    const vTotal = parseFloat(total.replace(',', '.'));
    const vEntrada = parseFloat(entrada.replace(',', '.') || '0');
    const nParcelas = parseInt(qtdP) || 1;
    const vParcela = (vTotal - vEntrada) / nParcelas;
    const dataAtual = new Date();

    try {
      const docRef = await addDoc(collection(db, 'compras'), {
        descricao: desc,
        valorTotal: vTotal,
        valorPago: 0,
        qtdParcelas: nParcelas
      });

      const batch = writeBatch(db);
      if (vEntrada > 0) {
        const refE = doc(collection(db, `compras/${docRef.id}/parcelas`));
        batch.set(refE, { numero: 0, descricao: 'Entrada', valor: vEntrada, pago: false, mesRef: dataAtual.getMonth(), anoRef: dataAtual.getFullYear() });
      }
      for (let i = 1; i <= nParcelas; i++) {
        const dataP = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + i, 1);
        const refP = doc(collection(db, `compras/${docRef.id}/parcelas`));
        batch.set(refP, { numero: i, descricao: `Parcela ${i}/${nParcelas}`, valor: vParcela, pago: false, mesRef: dataP.getMonth(), anoRef: dataP.getFullYear() });
      }
      await batch.commit();
      setModalNovaCompra(false);
      setDesc(''); setTotal(''); setEntrada(''); setQtdP('1');
    } catch (e) { Alert.alert("Erro", "Falha ao criar."); } finally { setSalvando(false); }
  };

  const confirmarExclusao = (id: string, descricao: string) => {
    Alert.alert("Excluir", `Apagar o contrato de "${descricao}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteDoc(doc(db, 'compras', id)) }
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.btnVoltar}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Financeiro 💰</Text>
      </View>

      <View style={styles.dashboard}>
        <View style={styles.dashboardRow}>
          <View style={styles.dashCard}>
            <Text style={styles.dashLabel}>TOTAL ORÇADO</Text>
            <Text style={styles.dashValor}>R$ {totalGeralOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.dashCard, { backgroundColor: cores.verde }]}>
            <Text style={styles.dashLabel}>TOTAL PAGO</Text>
            <Text style={styles.dashValor}>R$ {totalGeralPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        <View style={styles.progressoContainer}>
          <View style={styles.progressoHeader}>
            <Text style={styles.progressoTexto}>Falta pagar: R$ {restanteGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.progressoTexto}>{(progressoTotal * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.barraFundo}>
            <View style={[styles.barraFrente, { width: `${progressoTotal * 100}%` }]} />
          </View>
        </View>
      </View>

      <FlatList
        data={compras}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.cardCompraWrapper}>
            {/* CORREÇÃO DO TYPESCRIPT NA NAVEGAÇÃO AQUI: */}
            <TouchableOpacity
              style={[styles.cardCompra, item.valorPago >= item.valorTotal && { borderLeftColor: cores.verde }]}
              onPress={() => router.push({ pathname: "/parcelas/[id]", params: { id: item.id } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.descCompra}>{item.descricao}</Text>
                <Text style={styles.subCompra}>Pago: R$ {item.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / Total: R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>

              <TouchableOpacity style={styles.btnLixeira} onPress={() => confirmarExclusao(item.id, item.descricao)}>
                <Text style={{ fontSize: 18 }}>🗑️</Text>
              </TouchableOpacity>

              <Text style={styles.setinha}>{">"}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalNovaCompra(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalNovaCompra} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Novo Contrato</Text>
            <TextInput style={styles.input} placeholder="Ex: Fotógrafo" value={desc} onChangeText={setDesc} />
            <TextInput style={styles.input} placeholder="Valor Total (R$)" keyboardType="numeric" value={total} onChangeText={setTotal} />
            <TextInput style={styles.input} placeholder="Entrada / Sinal (R$)" keyboardType="numeric" value={entrada} onChangeText={setEntrada} />
            <TextInput style={styles.input} placeholder="Número de Parcelas" keyboardType="numeric" value={qtdP} onChangeText={setQtdP} />

            <TouchableOpacity style={styles.btnSalvar} onPress={salvarCompra} disabled={salvando}>
              <Text style={styles.btnSalvarText}>{salvando ? "Aguarde..." : "Gerar Cronograma"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalNovaCompra(false)}>
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
  cabecalho: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  btnVoltar: { color: cores.terracotaEscuro, fontWeight: 'bold', marginRight: 15 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: cores.textoEscuro },
  dashboard: { backgroundColor: cores.branco, margin: 20, padding: 20, borderRadius: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  dashboardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dashCard: { backgroundColor: cores.terracota, padding: 15, borderRadius: 18, width: '48%' },
  dashLabel: { fontSize: 10, fontWeight: '800', color: cores.textoEscuro, opacity: 0.6, marginBottom: 5 },
  dashValor: { fontSize: 16, fontWeight: 'bold', color: cores.textoEscuro },
  progressoContainer: { marginTop: 5 },
  progressoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressoTexto: { fontSize: 13, fontWeight: '700', color: cores.textoEscuro },
  barraFundo: { height: 10, backgroundColor: cores.cinza, borderRadius: 5, overflow: 'hidden' },
  barraFrente: { height: '100%', backgroundColor: cores.terracota },
  cardCompraWrapper: { marginBottom: 12 },
  cardCompra: { backgroundColor: cores.branco, padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', elevation: 2, borderLeftWidth: 6, borderLeftColor: cores.terracota },
  descCompra: { fontSize: 17, fontWeight: 'bold', color: cores.textoEscuro },
  subCompra: { fontSize: 12, color: '#888', marginTop: 4 },
  setinha: { fontSize: 18, color: cores.terracota, fontWeight: 'bold' },
  btnLixeira: { padding: 10, marginRight: 5, opacity: 0.6 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: cores.terracota, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: cores.branco, fontSize: 30, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: cores.branco, padding: 25, borderRadius: 20 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: cores.fundo, padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: cores.cinza },
  btnSalvar: { backgroundColor: cores.terracota, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnSalvarText: { color: cores.branco, fontWeight: 'bold', fontSize: 16 },
  btnFechar: { textAlign: 'center', marginTop: 15, color: '#999', fontWeight: 'bold' }
});