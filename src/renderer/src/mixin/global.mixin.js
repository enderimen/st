import { mapGetters, mapActions } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      getSeasonList: 'season/getSeasonList',
      getSeasonWithProductList: 'season/getSeasonWithProductList',
    }),
    getCurrentSeasonIdByName() {
      return seasonName => this.getSeasonList.find(season => season.label.split(' ')[0] == (seasonName))?.value;
    },
    getCurrentSeasonNameById() {
      return seasonId => this.getSeasonList.find(season => season.value == seasonId)?.label;
    }
  },
  methods: {
    ...mapActions({
      fetchAllSeasons: 'season/fetchAllSeasons'
    }),
    async loadSeasons() {
      try {
        await this.fetchAllSeasons();
      } catch (err) {
        console.error('Sezonlar yüklenirken hata oluştu:', err);
      }
    }
  },
  async mounted() {
    await this.loadSeasons();
  }
};