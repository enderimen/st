<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-date"></i> Sezonlar ({{ getSeasonWithProductList?.length }})</h1>
      <el-button type="primary" @click="isOpenDialog('add')" icon="el-icon-circle-plus"
        >Yeni Sezon Oluştur</el-button
      >
    </div>
    <!-- 
    NOT
      <ul>
        <li>CRUD</li>
        <li>Yeni Sezon Oluştur</li>
        <li>Sezon detayında ona bağlı olan partilerin old. ekrana atılabilir.</li>
        <li>O sezonda çıkan total kg vs bilgileri widget şeklinde ekranın üstünde yer alabilir.</li>
      </ul>
      <p>Müşteri ürün talebinde bulunduğunda carisinden, dolaylı yoldan ana stoktan düş.</p> -->
    <br />

    <div class="search">
      <el-input
        v-model="filter.search"
        placeholder="Sezon arayın"
        clearable
      />
    </div>

    <el-table
      :data="paginatedData"
      border
      style="width: 100%"
      empty-text="Sezon bulunamadı"
    >
      <!-- <el-table-column prop="id" label="ID" width="180"> </el-table-column> -->
      <el-table-column prop="name" label="Sezon İsmi"></el-table-column>
      <el-table-column prop="createdDate" label="Oluşturulma Zamanı">
        <template v-slot="scope">
          {{ scope.row.createdDate | formatDateWithClock }}
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="295">
        <template v-slot="scope">
          <el-button type="success" size="small" icon="el-icon-notebook-2" @click="handleClick(scope.row)">Sezon Üretimlerini Gör</el-button>
          <el-button type="primary" icon="el-icon-edit" circle @click="isOpenDialog('edit', scope.row)"></el-button>
          <el-button type="danger" icon="el-icon-delete" circle @click="open(scope.row)" :disabled="scope.row.totalOutputWeight > 0"></el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next"
      :total="filteredData?.length"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center"
    />
    <el-dialog
      :title="editingSeason ? 'Sezon İsmini Düzenle' : 'Yeni Sezon Oluştur'"
      :visible.sync="dialogVisible"
      width="30%"
    >
    <div>
    </div>
    <el-form label-position="top" :model="formData" label-width="100px">
      <el-form-item label="Sezon Adı">
          <el-input placeholder="Örneğin: Sezonu" v-model="formData.name" @input="handleNameInput" :max="5" class="input-with-select">
            <el-select v-model="formData.currentYear" slot="prepend" placeholder="Yıl Seçin" clearable>
              <el-option v-for="year in yearOptions" :label="year.label" :value="year.value" :key="year.value"></el-option>
            </el-select>
          </el-input>
          <p v-if="getSeasonName"><b>Ön İzleme:</b> {{ getSeasonName }}</p>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Vazgeç</el-button>
        <el-button type="primary" @click="saveSeason" :disabled="checkValidation">Kaydet</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import { mapActions } from 'vuex';
import globalMixin from '../mixin/global.mixin.js';

export default {
  name: 'Seasons',
  mixins: [globalMixin],
  data() {
    return {
      currentYear: '',
      originalYear: '',
      dialogVisible: false,
      formData: {
        id: "",
        name: "",
        currentYear: "",
      },
      currentPage: 1,
      pageSize: 9,
      editingSeason: false,
      filter: {
        search: ""
      },
      originalSeasonName: "",
      hasChanges: false
    }
  },
  computed: {
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData?.slice(start, end);
    },
    getYear() {
      return this.formData.currentYear || new Date().getFullYear();
    },
    getSeasonName() {
      let text = "";
      const name = this.formData.name.toLocaleUpperCase();
      if (name != '') {
        text = `"${this.getYear} ${ name }"`;
      }
      return text;
    },
    filteredData() {
      if (!this.filter.search) return this.getSeasonWithProductList;
      return this.getSeasonWithProductList?.filter(item =>
        item.name.toLowerCase().includes(this.filter.search.toLowerCase())
      );
    },
    checkValidation() {
      if (!this.formData.name.trim() || !this.formData.currentYear) return true;

      if (this.editingSeason && !this.hasChanges) return true;

      return false;
    },
    yearOptions() {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 3 }, (_, i) => {
      const year = currentYear + i;
      return { label: String(year), value: String(year) };
    });
  }
  },
  methods: {
    ...mapActions({
      addSeason: 'season/addSeason',
      updateSeason: 'season/updateSeason',
      deleteSeason: 'season/deleteSeason',
    }),
    handleNameInput(value) {
      // Sadece harfleri (Türkçe dahil) kabul et
      const onlyLetters = value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s]/g, '');
      this.formData.name = onlyLetters.toUpperCase();
    },
    handleClick(row) {
      this.$router.push({ name: "Manufacture", params: { season: row.id }});
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    isOpenDialog(type, row) {
      this.editingSeason = type === "edit";
      if (this.editingSeason && row) {
        this.formData.name = row.name.split(" ")[1] || "";
        this.formData.id = row.id;
        this.formData.createdDate = row.createdDate;
        this.originalSeasonName = this.formData.name;
        this.formData.currentYear = row.name.split(" ")[0] || "";
        this.originalYear = this.formData.currentYear;
      } else {
        this.formData.name = "";
        this.formData.currentYear = "";
        this.originalSeasonName = "";
        this.originalYear = "";
      }
      this.hasChanges = false;
      this.dialogVisible = true;
    },
    async saveSeason() {
      if (this.editingSeason) {
        await this.updateSeason({ 
          id: this.formData.id, 
          name: `${this.getYear} ${this.formData.name}`,
          createdDate: this.formData.createdDate
        });
        this.$notify({
          title: 'Başarılı!',
          type: 'success',
          message: 'Sezon bilgileri güncellendi!',
          duration: 3000,
          position: 'top-right',
        });
      } else {
        try {
          await this.addSeason({ name: `${this.getYear} ${this.formData.name}` });
          this.$notify({
            title: 'Başarılı!',
            type: 'success',
            message: 'Yeni sezon oluşturuldu!',
            duration: 3000,
            position: 'top-right',
          });
        } catch (error) {
          this.$notify({
            title: 'Uyarı!',
            type: 'info',
            message: error.message,
            duration: 3000,
            position: 'top-right',
          });
        }
      }
      this.dialogVisible = false;
      this.resetForm();
    },
    resetForm() {
      this.formData.name = "";
    },
    open(row) {
      this.$confirm(`${row.name} isimli sezonu, silmek istediğinden emin misiniz?`, 'Sezon Silme İşlemi', {
        distinguishCancelAndClose: true,
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal Et',
      })
      .then(async () => {
        await this.deleteSeason(row.id);
        this.$notify({
          title: 'Başarılı',
          type: 'success',
          message: 'Sezon başarıyla silindi!',
          duration: 3000,
          position: 'top-right',
        });
      })
      .catch(action => {
        this.$notify({
          title: 'Bilgi',
          type: 'info',
          message: 'İşlem iptal edildi',
          duration: 3000,
          position: 'top-right',
        })
      });
    }
  },
  watch: {
    "formData.name"(newVal) {
      if (this.editingSeason) {
        this.hasChanges = 
          newVal.trim() !== this.originalSeasonName.trim() ||
          this.formData.currentYear !== this.originalYear;
      } else {
        this.hasChanges = newVal.trim() !== "" && this.formData.currentYear !== "";
      }
    },
    "formData.currentYear"(newVal) {
      if (this.editingSeason) {
        this.hasChanges = 
          newVal !== this.originalYear ||
          this.formData.name.trim() !== this.originalSeasonName.trim();
      } else {
        this.hasChanges = newVal !== "" && this.formData.name.trim() !== "";
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-select .el-input {
    width: 95px;
  }
  .input-with-select .el-input-group__prepend {
    background-color: #fff;
    text-transform: uppercase;
  }
}
</style>