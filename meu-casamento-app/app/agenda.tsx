// Arquivo: app/agenda.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, StatusBar, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../src/firebase';

const cores = {
  primaria: '#4A4E69',
  secundaria: '#d87c6a',
  fundo: '#FDF0D5',
  branco: '#FFFFFF',
  hoje: '#22223B', // Cor bem escura para o dia atual
  marcador: '#9A8C98'
};

const NOMES_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function AgendaScreen() {
  const router = useRouter();
  const hojeGlobal = new Date();

  const [dataExibida, setDataExibida] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().getDate());

  const [modalVisivel, setModalVisivel] = useState(false);
  const [novoCompromisso, setNovoCompromisso] = useState('');
  const [listaEventosDia, setListaEventosDia] = useState<any[]>([]);
  const [diasComEventos, setDiasComEventos] = useState<Set<number>>(new Set());
  const [carregando, setCarregando] = useState(false);

  const mesAtual = dataExibida.getMonth();
  const anoAtual = dataExibida.getFullYear();

  // 1. MONITORAR O MÊS INTEIRO PARA MARCAR AS CORES
  useEffect(() => {
    const qMes = query(
      collection(db, 'agenda_casamento'),
      where('mes', '==', mesAtual),
      where('ano', '==', anoAtual)
    );

    const unsubMes = onSnapshot(qMes, (snap) => {
      const dias = new Set<number>();
      snap.docs.forEach(d => dias.add(d.data().dia));
      setDiasComEventos(dias);
    });
    return () => unsubMes();
  }, [dataExibida]);

  // 2. MONITORAR APENAS O DIA SELECIONADO PARA A LISTA
  useEffect(() => {
    setCarregando(true);
    const qDia = query(
      collection(db, 'agenda_casamento'),
      where('dia', '==', diaSelecionado),
      where('mes', '==', mesAtual),
      where('ano', '==', anoAtual)
    );

    const unsubDia = onSnapshot(qDia, (snap) => {
      setListaEventosDia(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    });
    return () => unsubDia();
  }, [diaSelecionado, dataExibida]);

  const mudarMes = (direcao: number) => {
    setDataExibida(new Date(anoAtual, mesAtual + direcao, 1));
    setDiaSelecionado(1);
  };

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDiaIndex = new Date(anoAtual, mesAtual, 1).getDay();
  const diasGrid = [...Array(primeiroDiaIndex).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.btnVoltar}>{"< Voltar"}</Text></TouchableOpacity>
        <View style={styles.controlesMes}>
          <TouchableOpacity onPress={() => mudarMes(-1)}><Text style={styles.seta}>◀</Text></TouchableOpacity>
          <Text style={styles.tituloMes}>{NOMES_MESES[mesAtual]} {anoAtual}</Text>
          <TouchableOpacity onPress={() => mudarMes(1)}><Text style={styles.seta}>▶</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.semanaRow}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <Text key={i} style={styles.txtSemana}>{d}</Text>)}
        </View>

        <View style={styles.grid}>
          {diasGrid.map((dia, index) => {
            if (!dia) return <View key={index} style={styles.diaBox} />;

            const isHoje = dia === hojeGlobal.getDate() && mesAtual === hojeGlobal.getMonth() && anoAtual === hojeGlobal.getFullYear();
            const isSelecionado = dia === diaSelecionado;
            const temEvento = diasComEventos.has(dia);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.diaBox,
                  isSelecionado && styles.diaSelecionado,
                  isHoje && !isSelecionado && styles.diaHoje // Borda especial se for hoje
                ]}
                onPress={() => setDiaSelecionado(dia)}
              >
                <Text style={[
                  styles.txtDia,
                  isSelecionado && { color: 'white' },
                  isHoje && !isSelecionado && { fontWeight: '900', color: cores.hoje }
                ]}>
                  {dia}
                </Text>

                {/* MARCADOR COLORIDO DE EVENTO */}
                {temEvento && <View style={[styles.dotEvento, isSelecionado && { backgroundColor: 'white' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.eventosArea}>
        <View style={styles.eventosHeader}>
          <Text style={styles.tituloDia}>{diaSelecionado} de {NOMES_MESES[mesAtual]}</Text>
          <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisivel(true)}><Text style={styles.btnAddTxt}>+ Novo</Text></TouchableOpacity>
        </View>

        <FlatList
          data={listaEventosDia}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemEvento}>
              <Text style={styles.txtEvento}>• {item.titulo}</Text>
              <TouchableOpacity onPress={() => deleteDoc(doc(db, 'agenda_casamento', item.id))}><Text>🗑️</Text></TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.vazio}>Nada agendado.</Text>}
        />
      </View>

      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Novo item para {diaSelecionado}/{mesAtual + 1}</Text>
            <TextInput style={styles.input} placeholder="Ex: Prova do vestido" value={novoCompromisso} onChangeText={setNovoCompromisso} autoFocus />
            <TouchableOpacity style={styles.btnSalvar} onPress={async () => {
              if (!novoCompromisso) return;
              await addDoc(collection(db, 'agenda_casamento'), { titulo: novoCompromisso, dia: diaSelecionado, mes: mesAtual, ano: anoAtual });
              setNovoCompromisso(''); setModalVisivel(false);
            }}><Text style={styles.btnSalvarTxt}>Agendar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisivel(false)}><Text style={styles.btnFechar}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 10 },
  btnVoltar: { color: cores.primaria, fontWeight: 'bold', marginBottom: 15 },
  controlesMes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloMes: { fontSize: 20, fontWeight: 'bold', color: cores.primaria },
  seta: { fontSize: 20, color: cores.secundaria, padding: 10 },
  calendarCard: { backgroundColor: cores.branco, margin: 20, padding: 15, borderRadius: 25, elevation: 4 },
  semanaRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  txtSemana: { fontWeight: 'bold', color: '#CCC', width: 40, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  diaBox: { width: '14.28%', height: 45, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  diaSelecionado: { backgroundColor: cores.primaria, borderRadius: 12 },
  diaHoje: { borderWidth: 2, borderColor: cores.hoje, borderRadius: 12 }, // Marcador fixo do dia atual
  txtDia: { fontSize: 16, color: cores.primaria },
  dotEvento: { width: 7, height: 7, borderRadius: 5, backgroundColor: cores.secundaria, marginTop: 2 }, // Bolinha colorida
  eventosArea: { flex: 1, paddingHorizontal: 25 },
  eventosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  tituloDia: { fontSize: 18, fontWeight: 'bold', color: cores.primaria },
  btnAdd: { backgroundColor: cores.secundaria, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12 },
  btnAddTxt: { fontWeight: 'bold', color: cores.primaria },
  itemEvento: { backgroundColor: cores.branco, padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txtEvento: { fontSize: 15, color: cores.primaria, flex: 1 },
  vazio: { textAlign: 'center', marginTop: 20, color: '#999', fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: 'white', padding: 25, borderRadius: 25 },
  modalTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 15, marginBottom: 20 },
  btnSalvar: { backgroundColor: cores.primaria, padding: 15, borderRadius: 15, alignItems: 'center' },
  btnSalvarTxt: { color: 'white', fontWeight: 'bold' },
  btnFechar: { textAlign: 'center', marginTop: 15, color: '#999' }
});