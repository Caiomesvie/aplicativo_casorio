// Arquivo: app/parcelas/[id].tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { collection, doc, onSnapshot, updateDoc, query, orderBy, increment, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase'; // Atenção ao caminho dos dois pontos '..' aqui

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

type Parcela = {
  id: string;
  numero: number;
  descricao: string;
  valor: number;
  pago: boolean;
  mesRef: number;
  anoRef: number;
}

export default function DetalhesParcelasScreen() {
  const { id } = useLocalSearchParams(); // Pega o ID da compra na URL
  const router = useRouter();

  const [nomeContrato, setNomeContrato] = useState("Carregando...");
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [total, setTotal] = useState(0);

  // 1. Buscar o nome do contrato principal
  useEffect(() => {
    if (id) {
      const docRef = doc(db, 'compras', id as string);
      getDoc(docRef).then(snap => {
        if (snap.exists()) {
          setNomeContrato(snap.data().descricao);
          setTotal(snap.data().valorTotal);
        }
      });
    }
  }, [id]);

  // 2. Buscar as parcelas atreladas a ele
  useEffect(() => {
    if (id) {
      const q = query(collection(db, `compras/${id}/parcelas`), orderBy('numero', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        setParcelas(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Parcela[]);
      });
      return () => unsub();
    }
  }, [id]);

  const alternarStatusParcela = async (parcela: Parcela) => {
    try {
      const refParcela = doc(db, `compras/${id}/parcelas`, parcela.id);
      const refCompra = doc(db, 'compras', id as string);
      const ajusteValor = parcela.pago ? -parcela.valor : parcela.valor;

      await updateDoc(refParcela, { pago: !parcela.pago });
      await updateDoc(refCompra, { valorPago: increment(ajusteValor) });
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar a parcela.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.btnVoltar}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Detalhamento 📋</Text>
      </View>

      <View style={styles.headerInfo}>
        <Text style={styles.nomeContrato}>{nomeContrato}</Text>
        <Text style={styles.totalContrato}>Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
      </View>

      <FlatList
        data={parcelas}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.itemParcela, item.pago && { backgroundColor: '#E8F5E9', borderColor: cores.verde }]}
            onPress={() => alternarStatusParcela(item)}
          >
            <View>
              <Text style={[styles.txtParcela, item.pago && { color: cores.verdeEscuro }]}>
                {item.descricao}
              </Text>
              {/* Mostra a data se ela existir no banco */}
              <Text style={styles.txtValorParcela}>
                R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                {item.anoRef ? ` • ${(item.mesRef + 1).toString().padStart(2, '0')}/${item.anoRef}` : ''}
              </Text>
            </View>
            <View style={[styles.checkCirculo, item.pago && { backgroundColor: cores.verde, borderColor: cores.verde }]}>
              {item.pago && <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  btnVoltar: { color: cores.terracotaEscuro, fontWeight: 'bold', marginRight: 15 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: cores.textoEscuro },
  headerInfo: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: cores.cinza },
  nomeContrato: { fontSize: 22, fontWeight: 'bold', color: cores.textoEscuro },
  totalContrato: { fontSize: 16, color: cores.terracotaEscuro, marginTop: 5, fontWeight: 'bold' },
  itemParcela: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: cores.branco, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: cores.cinza, elevation: 1 },
  txtParcela: { fontSize: 16, fontWeight: 'bold', color: cores.textoEscuro },
  txtValorParcela: { fontSize: 14, color: '#666', marginTop: 4 },
  checkCirculo: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' }
});