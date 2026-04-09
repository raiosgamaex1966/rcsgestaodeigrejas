import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Navigation, Map, ShieldAlert, BarChart3, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from "recharts";

interface LocationData {
  state: string;
  count: number;
}

interface CityData {
  city: string;
  state: string;
  count: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

const SuperAdminMap = () => {
  const [stateData, setStateData] = useState<LocationData[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    const fetchGeoData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("address_state, address_city")
        .not("address_state", "is", null);

      if (data) {
        setTotalMembers(data.length);

        // Group by State
        const tempStates: Record<string, number> = {};
        const tempCities: Record<string, number> = {};

        data.forEach(p => {
          if (p.address_state) {
            const state = p.address_state.toUpperCase().trim();
            tempStates[state] = (tempStates[state] || 0) + 1;

            if (p.address_city) {
              const city = `${p.address_city.trim()} - ${state}`;
              tempCities[city] = (tempCities[city] || 0) + 1;
            }
          }
        });

        const stateArray = Object.keys(tempStates)
          .map(k => ({ state: k, count: tempStates[k] }))
          .sort((a, b) => b.count - a.count);

        const cityArray = Object.keys(tempCities)
          .map(k => {
            const [city, state] = k.split(" - ");
            return { city, state, count: tempCities[k] };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 cities

        setStateData(stateArray);
        setCityData(cityArray);
      }
      setLoading(false);
    };

    fetchGeoData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
          <Map className="w-8 h-8 text-primary" />
          Mapa de Membros
        </h1>
        <p className="text-muted-foreground mt-1">
          Distribuição geográfica dos usuários ativos na plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Cobertura Nacional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estados Atingidos:</span>
              <span className="font-bold text-lg">{stateData.length} de 27</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${(stateData.length / 27) * 100}%` }}
              />
            </div>

            <div className="pt-4 border-t border-primary/10">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                Top 5 Cidades
              </h4>
              <div className="space-y-3">
                {cityData.slice(0, 5).map((city, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">
                      {city.city} <span className="text-xs text-muted-foreground">({city.state})</span>
                    </span>
                    <span className="text-sm font-medium px-2 py-0.5 bg-background rounded border">
                      {city.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Membros por Estado
            </CardTitle>
            <CardDescription>
              Volume absoluto de membros cadastrados com endereço preenchido ({totalMembers} total).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Mapeando localizações...
              </div>
            ) : stateData.length === 0 ? (
              <div className="h-64 flex items-center justify-center flex-col gap-2 text-muted-foreground">
                <ShieldAlert className="w-8 h-8 text-amber-500 opacity-50" />
                <p>Nenhum dado geográfico encontrado nos membros atuais.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="state" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [`${val} membros`, 'Quantidade']}
                      labelFormatter={(label) => `Estado: ${label}`}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {cityData.length > 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Outras Cidades com Relevância
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {cityData.slice(5).map((city, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <p className="font-medium text-sm truncate">{city.city}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{city.state}</span>
                    <span className="text-xs font-bold text-primary">{city.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuperAdminMap;
